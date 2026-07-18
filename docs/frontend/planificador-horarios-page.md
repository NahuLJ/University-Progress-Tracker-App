# Página Planificador de Horarios — Especificación Técnica (implementada)

> **Estado de implementación:** ✅ Completa. `PlanificacionPage` usa `usePlanificacion` (períodos, materias
> del período, desbloqueables, guardar) y el store zustand (`periodoActivo`, `celdas`, `materiasDisponibles`,
> `dirty`). Drag & drop HTML5 nativo entre `MateriaDisponibleList` y `BloqueHorarioCelda`. `NuevoPeriodoModal`
> crea períodos (RHF + Zod). `Extras.tsx` tiene `LeyendaHorarios` y `MateriasDesbloqueablesList`
> (`VistaSemanalHeader`/`VistaHorariosHeader`/`PeriodoSelector` eliminados por código muerto). Sin datos
> mockeados.

## Estructura de Componentes (real)

```
pages/
└── PlanificacionPage.tsx        # orquesta períodos + calendario (carrera activa vía useCarreraActiva())

components/planificacion/
├── CalendarioSemanal.tsx        # grilla 7 bloques × 6 días (CSS grid) + MateriaDisponibleList
├── BloqueHorarioCelda.tsx       # celda drop zone (HTML5 drag & drop) + MateriaPlanificadaChip
├── MateriaPlanificadaChip.tsx   # chip de materia con botón quitar
├── MateriaDisponibleList.tsx    # lista lateral draggable de materias pendientes
├── NuevoPeriodoModal.tsx        # formulario para crear período (año/instancia/nombre)
├── PlanificacionTabs.tsx        # tabs por período + botón "+ Nueva"
└── Extras.tsx                   # LeyendaHorarios, MateriasDesbloqueablesList

components/ui/
├── Card.tsx · Modal.tsx · Select.tsx · Button.tsx · Badge.tsx

hooks/
└── usePlanificacion.ts          # períodos, materias del período, desbloqueables, guardar, cargar

services/planificacion.service.ts # listarPeriodos, crearPeriodo, obtenerMateriasDelPeriodo,
                                   # planificarMateria, obtenerMateriasDesbloqueables, ...

store/planificacion.store.ts      # zustand (devtools): período activo, celdas, materias, dirty
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
    ├── Card con acciones: Descartar cambios (si dirty) · Guardar planificación (si dirty)
    ├── CalendarioSemanal
    │   ├── Header grilla (Horario | Lun … Sáb)
    │   ├── Filas 08-10 … 20-22 → BloqueHorarioCelda (drop zones) con MateriaPlanificadaChip
    │   └── MateriaDisponibleList (draggable, materias no asignadas)
    └── Extras: LeyendaHorarios + MateriasDesbloqueablesList
```

---

## Manejo del Estado — Store de Planificación (zustand)

`store/planificacion.store.ts` (middleware `devtools`):

```typescript
interface MateriaEnCelda { planificacionId: number; materiaId: number; nombre: string; codigo: string; creditos: number; }

interface PlanificacionState {
    periodoActivo: { periodoId: number | null; anio: number; instancia: string; nombre: string | null } | null;
    celdas: Record<string, MateriaEnCelda[]>;   // key "BLOQUE_ID-DIA"
    materiasDisponibles: MateriaEnCelda[];
    dirty: boolean;
    setPeriodoActivo / setCeldas / asignarMateria / quitarMateria / setMateriasDisponibles / marcarGuardado / limpiarStore;
}
```

`asignarMateria(bloqueId, dia, materiaId)` mueve la materia desde `materiasDisponibles` a `celdas[key]`
(con `planificacionId: 0` = nueva). `quitarMateria` la devuelve a disponibles. `dirty` se pone en true
en ambas, y `marcarGuardado()` lo resetea.

### Hook — `usePlanificacion`

- `listarPeriodos(usuarioCarreraId)` (query, enabled si hay `usuarioCarreraId`).
- `useProgreso(usuarioCarreraId)` → materias con estado ≠ "Completada" se cargan en `materiasDisponibles`.
- `obtenerMateriasDesbloqueables(periodoActivo.periodoId)` (query, enabled si hay período activo).
- `cargarPeriodo(periodoId)` (callback): trae `obtenerMateriasDelPeriodo` y puebla `celdas`, restando
  las ya planificadas de `materiasDisponibles`.
- `crearPeriodo` (mutation) e `guardar` (mutation): envía solo las materias con `planificacionId === 0`
  vía `planificarMateria(periodoId, { materiaId, bloqueId, diaSemana })` en paralelo (`Promise.all`).

---

## Comportamiento UX/UI

### CalendarioSemanal — Vista Principal

Grilla CSS `grid-cols-[auto_repeat(6,1fr)]` con 7 bloques (08-10, 10-12, 12-14, 14-16, 16-18, 18-20,
20-22) × 6 días (Lunes–Sábado). `BloqueHorarioCelda` es una drop zone (borde punteado; resalta en azul
al arrastrar encima). `MateriaPlanificadaChip` muestra nombre + código y un "×" para quitar.

### Drag & Drop (HTML5 nativo)

| Acción | Comportamiento |
|---|---|
| Arrastrar desde "Disponibles" a una celda | `asignarMateria` mueve la materia a la celda y la quita de disponibles |
| Click en "×" del chip | `quitarMateria` la devuelve a disponibles |
| Arrastrar una materia ya en el calendario | La celda destino la recibe (se reasigna por key) |
| Hover sobre celda vacía | Borde punteado indicando drop zone |

### NuevoPeriodoModal

Formulario RHF + Zod: `anio` (2020–2030), `instancia` (Verano / 1er Cuatrimestre / 2do Cuatrimestre),
`nombre` opcional. Al confirmar llama a `crearPeriodo`.

### MateriasDesbloqueablesList (`Extras.tsx`)

Lista de materias que se desbloquearían al completar las planificadas, con su `correlativasFaltantes`.
Si está vacía muestra "No hay materias nuevas por desbloquear".

### LeyendaHorarios (`Extras.tsx`)

Badges de color por materia única presente en el calendario (paleta de 7 colores cíclicos).

### Validaciones / Estados

| Regla | Comportamiento |
|---|---|
| Solo materias pendientes en disponibles | Se filtran las "Completada" del progreso |
| Cambios sin guardar (`dirty`) | Botones "Descartar"/"Guardar" habilitados; "Descartar" llama `limpiarStore()` + `cargarPeriodo` |
| Guardar | Envía solo novedades (`planificacionId === 0`); al éxito `marcarGuardado()` + invalida queries |
| Sin períodos | `EmptyState` "No hay planificaciones" + botón crear |
| Cargando | `Skeleton` del calendario |
