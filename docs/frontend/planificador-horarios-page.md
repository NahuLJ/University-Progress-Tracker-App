# Página Planificador de Horarios — Especificación Técnica (implementada)

> **Estado de implementación:** ✅ Completa. `PlanificacionPage` usa `usePlanificacion` (períodos, materias
> del período, desbloqueables, guardar) y el store zustand (`periodoActivo`, `celdas`, `materiasDisponibles`,
> `dirty`, `draggedMateriaId`, `hoveredCell`). Drag & drop HTML5 nativo entre `MateriaDisponibleList`
> y `BloqueHorarioCelda` con preview multi-bloque. `NuevoPeriodoModal` crea períodos (RHF + Zod).
> `Extras.tsx` tiene `LeyendaHorarios` y `MateriasDesbloqueablesList`.
> Las materias disponibles se filtran por correlativas cumplidas (backend). Las materias
> desbloqueables se calculan según las seleccionadas actualmente en el calendario. Sin datos mockeados.

## Estructura de Componentes (real)

```
pages/
└── PlanificacionPage.tsx        # orquesta períodos + calendario (carrera activa vía useCarreraActiva())

components/planificacion/
├── CalendarioSemanal.tsx        # flex: sidebar materias disponibles (izq) + Leyenda + grilla (der)
├── BloqueHorarioCelda.tsx       # celda drop zone (HTML5 drag & drop) + MateriaPlanificadaChip
├── MateriaPlanificadaChip.tsx   # chip con solo código + botón quitar (sin nombre, tamaño uniforme)
├── MateriaDisponibleList.tsx    # sidebar draggable con materias pendientes (filtradas por correlativas cumplidas)
├── NuevoPeriodoModal.tsx        # formulario para crear período (año/instancia/nombre)
├── PlanificacionTabs.tsx        # tabs por período + botón "+ Nueva"
└── Extras.tsx                   # LeyendaHorarios, MateriasDesbloqueablesList

components/ui/
├── Card.tsx · Modal.tsx · Select.tsx · Button.tsx · Badge.tsx

hooks/
└── usePlanificacion.ts          # períodos, planEstudios (correlativas), materias del período,
                                  # desbloqueables (con materiaIds de celdas), guardar, cargar.
                                  # Recibe usuarioCarreraId + carreraId. Filtra disponibles por correlativas.

services/planificacion.service.ts # listarPeriodos, crearPeriodo, obtenerMateriasDelPeriodo,
                                   # planificarMateria, obtenerMateriasDesbloqueables (acepta materiaIds), ...

store/planificacion.store.ts      # zustand (devtools): período activo, celdas, materias, dirty.
                                  # resetCeldas() para descartar sin limpiar materiasDisponibles.
```

> **Estado:** `PlanificacionPage` resuelve la carrera activa con `useCarreraActiva()` (empty state si no
> hay carreras). La página usa `PlanificacionTabs` para los períodos y embebe el header de la grilla en
> `CalendarioSemanal`. `PeriodoSelector` y los headers `VistaSemanalHeader`/`VistaHorariosHeader` fueron
> eliminados (código muerto); `Extras.tsx` solo contiene `LeyendaHorarios` y `MateriasDesbloqueablesList`.

### Árbol de Composición

```
MainLayout
└── PlanificacionPage
    ├── Header "Planificación de Horarios" + botón "+ Nueva planificación"
    ├── PlanificacionTabs (un tab por período + "+ Nueva")
    ├── Card con acciones: Descartar cambios (modal de confirmación) · Guardar planificación (si dirty)
    ├── CalendarioSemanal
    │   ├── Sidebar izq: MateriaDisponibleList (draggable, solo materias con correlativas cumplidas)
    │   └── Panel der:
    │       ├── LeyendaHorarios (badges de colores)
    │       └── Header grilla (Horario | Lun … Sáb)
    │           └── Filas 08-10 … 20-22 → BloqueHorarioCelda (drop zones, min-h 48px) con MateriaPlanificadaChip (solo código)
    └── MateriasDesbloqueablesList (grid, según materias seleccionadas actualmente en celdas)
```

---

## Manejo del Estado — Store de Planificación (zustand)

`store/planificacion.store.ts` (middleware `devtools`):

```typescript
interface MateriaEnCelda { planificacionId: number; materiaId: number; nombre: string; codigo: string; creditos: number; cargaHoraria: number; }

interface PlanificacionState {
    periodoActivo: { periodoId: number | null; anio: number; instancia: string; nombre: string | null } | null;
    celdas: Record<string, MateriaEnCelda | null>;   // key "BLOQUE_ID-DIA"
    materiasDisponibles: MateriaEnCelda[];
    dirty: boolean;
    draggedMateriaId: number | null;
    hoveredCell: { bloqueId: number; dia: string } | null;
    setPeriodoActivo / setCeldas / setMateriasDisponibles / asignarMateria / quitarMateria /
        marcarGuardado / resetCeldas / limpiarStore / setDraggedMateriaId / setHoveredCell;
}
```

Constantes auxiliares en `types/planificacion.types.ts`:
- `MAX_BLOQUE_ID = 7` — bloque máximo (20-22hs).
- `bloquesRequeridos(cargaHoraria)` → `Math.max(1, ceil(cargaHoraria / 2))`. Calcula cuántos
  bloques de 2h ocupa una materia con su carga horaria semanal (ej: 8h/sem → 4 bloques).

`asignarMateria(bloqueId, dia, materiaId)` mueve la materia desde `materiasDisponibles` a `celdas[key]`
(con `planificacionId: 0` = nueva). Valida que `bloqueId + span - 1 <= MAX_BLOQUE_ID` (no excede el día).
`quitarMateria` la devuelve a disponibles. `dirty` se pone en true en ambas, y `marcarGuardado()` lo resetea.
`resetCeldas()` limpia solo `celdas` y `dirty` sin tocar `materiasDisponibles` (usado en descartar cambios).

### Hook — `usePlanificacion(usuarioCarreraId, carreraId)`

- `listarPeriodos(usuarioCarreraId)` (query, enabled si hay `usuarioCarreraId`).
- `useProgreso(usuarioCarreraId)` → materias con estado ≠ "Completada".
- `obtenerMateriasDisponibles(usuarioCarreraId)` (query): lista de materias que el usuario
  puede planificar (backend filtra por correlativas cumplidas y estado ≠ Completada). Los datos
  se sincronizan al store vía `useEffect` incondicional (ver abajo).
- `obtenerMateriasDesbloqueables(periodoActivo.periodoId, materiaIdsDeCeldas)` (query): se pasa
  el array de materiaIds actualmente en `celdas`; la query solo se habilita cuando hay al menos
  una materia en celdas. El queryKey incluye los IDs ordenados para refrescar al cambiar selección.
- `cargarPeriodo(periodoId)` (callback): trae `obtenerMateriasDelPeriodo` y puebla `celdas`, restando
  las ya planificadas de `materiasDisponibles`.
- `crearPeriodo` (mutation) e `guardar` (mutation): envía solo las materias con `planificacionId === 0`
  vía `planificarMateria(periodoId, { materiaId, bloqueId, diaSemana })` en paralelo (`Promise.all`).

#### Sincronización React Query → Store

Un `useEffect` escucha cambios en `materiasDisponiblesData` (React Query) y actualiza el store
incondicionalmente. Si hay un `periodoActivo`, filtra las materias que ya están en `celdas`.
Esto asegura que al volver de progreso (donde se invalidó la query), el store refleje los cambios
(ej: materia recién completada ya no aparece como disponible).

---

## Comportamiento UX/UI

### CalendarioSemanal — Vista Principal

Layout `flex`: sidebar izquierdo con `MateriaDisponibleList` (w-72) y panel derecho con `LeyendaHorarios`
seguido de la grilla. Grilla CSS `grid-cols-[auto_repeat(6,1fr)]` con 7 bloques (08-10, 10-12, 12-14,
14-16, 16-18, 18-20, 20-22) × 6 días (Lunes–Sábado). `BloqueHorarioCelda` es una drop zone (borde
punteado; resalta en azul al arrastrar encima, `min-h-[48px]`). `MateriaPlanificadaChip` muestra solo
el código (sin nombre) para mantener tamaño uniforme en las celdas, más un "×" para quitar.

### Drag & Drop (HTML5 nativo)

| Acción | Comportamiento |
|---|---|
| Arrastrar desde "Disponibles" | `onDragStart` setea `draggedMateriaId` en el store; `onDragEnd` lo limpia |
| Hover sobre celda | `onDragEnter` setea `hoveredCell` en el store; la celda resalta en azul |
| Preview multi-bloque | `CalendarioSemanal` calcula vía `useEffect([draggedMateriaId, hoveredCell])` cuántos bloques ocupa la materia (`bloquesRequeridos`) y resalta las celdas previas, respetando `MAX_BLOQUE_ID` |
| Soltar en celda | `asignarMateria` mueve la materia a `celdas[key]` y la quita de disponibles |
| Click en "×" del chip | `quitarMateria` la devuelve a disponibles |
| Arrastrar materia ya en calendario | La celda destino la recibe (se reasigna por key) |

### NuevoPeriodoModal

Formulario RHF + Zod: `anio` (2020–2030), `instancia` (Verano / 1er Cuatrimestre / 2do Cuatrimestre),
`nombre` opcional. Al confirmar llama a `crearPeriodo`.

### MateriasDesbloqueablesList (`Extras.tsx`)

Grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) de materias que se desbloquearían al completar
las materias actualmente seleccionadas en el calendario (no las guardadas en DB). Se pasa `materiaIds`
de las celdas actuales al backend. Solo se muestra cuando hay al menos una materia en celdas.
Si está vacía muestra "No hay materias nuevas por desbloquear".

### LeyendaHorarios (`Extras.tsx`)

Badges de color por materia única presente en el calendario (paleta de 7 colores cíclicos).
Se renderiza dentro de `CalendarioSemanal`, arriba de la grilla horaria.

### Validaciones / Estados

| Regla | Comportamiento |
|---|---|---|
| Solo materias con correlativas cumplidas en disponibles | El backend filtra las materias con correlativas no cumplidas y las que ya están completadas; el store se sincroniza desde React Query al cambiar progreso |
| Cambios sin guardar (`dirty`) | Botones "Descartar"/"Guardar" habilitados; "Descartar" abre modal de confirmación, luego llama `resetCeldas()` + `cargarPeriodo` (sin limpiar `materiasDisponibles`) |
| Guardar | Envía solo novedades (`planificacionId === 0`); al éxito `marcarGuardado()` + invalida queries |
| Materias desbloqueables dinámicas | Se calculan según las materias actualmente en `celdas` (no las guardadas en DB); query solo se habilita si hay al menos una materia seleccionada |
| Materia no entra en bloques restantes | `asignarMateria` verifica `bloqueId + span - 1 <= MAX_BLOQUE_ID`; si excede, notifica error y no asigna |
| Preview multi-bloque al arrastrar | El `useEffect` de preview filtra con `MAX_BLOQUE_ID` para no mostrar preview fuera del rango horario |
| Sin períodos | `EmptyState` "No hay planificaciones" + botón crear |
| Sin período seleccionado | `EmptyState` "Seleccioná una planificación" con ícono |
| Cargando | `Skeleton` del calendario |
