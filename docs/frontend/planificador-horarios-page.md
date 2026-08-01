# Página Planificador de Horarios — Especificación Técnica (implementada)

> **Estado de implementación:** ✅ Completa. Drag & drop HTML5 nativo. Cada bloque = 2h; las materias
> se agregan de a un bloque por vez, pudiendo distribuir las horas en distintos días. Los chips
> del calendario son draggables (mover a otra celda). `NuevoPeriodoModal` crea períodos (RHF + Zod).
> `Extras.tsx` tiene `MateriasDesbloqueablesList`. Las materias desbloqueables se calculan según la
> selección actual del calendario (reemplazan las de DB, permitiendo reflejar altas y bajas).

## Estructura de Componentes (real)

```
pages/
├── PlanificacionesPage.tsx      # lista de planificaciones (cards + paginación) + botón "+ Nueva planificación"
├── PlanificacionPage.tsx        # editor de período activo (carrera activa vía useCarreraActiva())

components/planificacion/
├── CalendarioSemanal.tsx        # flex: sidebar materias disponibles (izq) + grilla horaria (der)
├── BloqueHorarioCelda.tsx       # celda drop zone (HTML5 drag & drop); muestra chip o zona vacía
├── MateriaPlanificadaChip.tsx   # chip draggable: código + nombre + botón quitar
├── MateriaDisponibleList.tsx    # sidebar draggable con materias pendientes (muestra horas restantes)
├── NuevoPeriodoModal.tsx        # formulario para crear período (año/instancia/nombre)
├── EditarPeriodoModal.tsx       # formulario para editar período (año/instancia/nombre) - reutiliza schema
├── PlanificacionTabs.tsx        # tabs por período + botón "+ Nueva"
└── Extras.tsx                   # MateriasDesbloqueablesList

components/ui/
├── Card.tsx · Modal.tsx · Select.tsx · Button.tsx · Badge.tsx

hooks/
└── usePlanificacion.ts          # períodos (list + paginado), planEstudios, materias del período,
                                   # desbloqueables, guardar, cargar, actualizarPeriodo, actualizarPeriodo.
                                   # Recibe usuarioCarreraId + carreraId. Filtra disponibles por correlativas.

services/planificacion.service.ts # listarPeriodos, listarPeriodosPaginado, crearPeriodo, actualizarPeriodo,
                                   # obtenerMateriasDelPeriodo, planificarMateria, obtenerMateriasDesbloqueables (acepta materiaIds), ...

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
    │   └── Banner "Tenés cambios sin guardar" (siempre presente, alterna opacidad)
    ├── CalendarioSemanal
    │   ├── Sidebar izq: MateriaDisponibleList (draggable, con horas restantes por materia)
    │   └── Panel der:
    │       └── Grilla CSS grid 7×6 + time labels
    │           └── BloqueHorarioCelda (h-12, borde punteado / chip draggable)
    └── MateriasDesbloqueablesList (grid, según materias seleccionadas actualmente en celdas)
```

---

## Manejo del Estado — Store de Planificación (zustand)

`store/planificacion.store.ts` (middleware `devtools`):

```typescript
interface MateriaEnCelda { planificacionId: number; materiaId: number; nombre: string; codigo: string; creditos: number; cargaHoraria: number; }

interface PlanificacionState {
    periodoActivo: { periodoId: number | null; anio: number; instancia: string; nombre: string | null } | null;
    celdas: Record<string, MateriaEnCelda | null>;   // key "BLOQUE_ID-DIA", cada entrada = 1 bloque (2h)
    materiasDisponibles: MateriaEnCelda[];
    dirty: boolean;
    draggedMateriaId: number | null;
    draggedFromKey: string | null;           // celda origen al mover chip existente
    hoveredCell: { bloqueId: number; dia: string } | null;
    removidas: number[];                     // planificacionIds a eliminar en el próximo guardado
}
```

Constantes auxiliares en `types/planificacion.types.ts`:
- `HORAS_POR_BLOQUE = 2` — cada bloque equivale a 2h.
- `horasAsignadas(materiaId, celdas)` → cuenta las entradas en `celdas` para esa materia × 2.

**`asignarMateria(bloqueId, dia, materiaId)`** asigna **1 bloque** (2h). Si la materia destino ya está
ocupada por otra distinta, reemplaza (la anterior se agenda en `removidas` si estaba persistida y
vuelve a disponibles si le quedan horas). La materia permanece en disponibles hasta completar su
`cargaHoraria`. La validación impide agregar un bloque adicional solo cuando `horasAsignadas`
≥ `cargaHoraria` (no bloquea si el siguiente bloque puede cubrir las horas restantes, p. ej.,
una materia de 5h con 2 bloques ya asignados aún permite un 3er bloque para la última hora).

**`moverMateria(sourceKey, destBloqueId, destDia)`** mueve un chip existente entre celdas. La fuente
se agrega a `removidas` si estaba persistida. Si el destino está ocupado, evicción similar a
`asignarMateria`.

**`quitarMateria(bloqueId, dia)`** elimina la celda. Si el `planificacionId` es > 0, se agrega a
`removidas`. La materia vuelve a disponibles si aún le quedan horas por asignar en otras celdas.

`dirty` se pone en true en todas las mutaciones. `marcarGuardado()` resetea `dirty` y `removidas`.
`resetCeldas()` limpia solo `celdas`, `dirty` y `removidas` sin tocar `materiasDisponibles`
(usado en descartar cambios).

### Hook — `usePlanificacion(usuarioCarreraId, carreraId)`

- `listarPeriodos(usuarioCarreraId)` (query, enabled si hay `usuarioCarreraId`).
- `useProgreso(usuarioCarreraId, carreraId)` → materias con estado ≠ "Completada" (progreso compartido del usuario).
- `obtenerMateriasDisponibles(usuarioCarreraId)` (query): lista de materias que el usuario
  puede planificar (backend filtra por correlativas cumplidas y estado ≠ Completada). Los datos
  se sincronizan al store vía `useEffect` que filtra por `horasAsignadas < cargaHoraria`.
- `obtenerMateriasDesbloqueables(periodoActivo.periodoId, idsSeleccionados)` (query): se pasa
  **siempre** el array de materiaIds actualmente en `celdas` (incluso vacío). El backend los usa
  como **lista completa** (reemplaza las de DB). El queryKey incluye los IDs ordenados para
  refrescar al cambiar selección.
- `cargarPeriodo(periodoId)` (callback): trae `obtenerMateriasDelPeriodo` y puebla `celdas`,
  filtrando disponibles por `horasAsignadas < cargaHoraria` (materias parcialmente planificadas
  permanecen disponibles).
- `crearPeriodo` (mutation).
- `actualizarPeriodo` (mutation): PATCH `/api/planificacion/periodos/:id` con los datos editados.
- `guardar` (mutation): primero ejecuta DELETE de `removidas` (secuencial), luego POST de
  asignaciones nuevas (secuencial). Al completar, actualiza los `planificacionId` de las celdas
  nuevas con los IDs reales devueltos por el backend, evitando re-POST en guardados posteriores.

#### Sincronización React Query → Store

Un `useEffect` escucha cambios en `materiasDisponiblesData` (React Query) y actualiza el store
filtrando por `horasAsignadas`. Si hay un `periodoActivo`, mantiene en disponibles las materias
que aún no completaron su `cargaHoraria` en el calendario.

---

## Comportamiento UX/UI

### CalendarioSemanal — Vista Principal

Layout `flex`: sidebar izquierdo con `MateriaDisponibleList` (w-72) y panel derecho con la grilla.
Grilla CSS `grid-cols-[auto_repeat(6,1fr)]` con 7 bloques (08-10, 10-12, 12-14, 14-16, 16-18, 18-20,
20-22) × 6 días (Lunes–Sábado). Cada celda tiene `h-12` fijo (48px) para evitar variación entre
ocupadas y vacías. Los textos de los chips tienen `truncate` para no desbordar.

### Drag & Drop (HTML5 nativo)

| Acción | Comportamiento |
|---|---|
| Arrastrar desde "Disponibles" | `onDragStart` setea `draggedMateriaId`; `onDragEnd` lo limpia + `draggedFromKey` |
| Arrastrar chip existente | `onDragStart` setea `draggedMateriaId` + `draggedFromKey` (celda de origen) |
| Hover sobre celda | `onDragEnter` setea `hoveredCell` en el store; la celda resalta |
| Soltar desde disponibles | `asignarMateria` asigna 1 bloque (2h) en `celdas[key]`. Si hay otra materia la reemplaza. La materia origen sigue en disponibles hasta completar su `cargaHoraria` |
| Soltar chip existente | `moverMateria`: borra origen, asigna en destino. Si `draggedFromKey` no existe en celdas (stale), se trata como drop nuevo |
| Click en "×" del chip | `quitarMateria`: elimina la celda, agenda `planificacionId` en `removidas` si estaba persistida, y restaura a disponibles si le quedan horas |
| Arrastrar materia ya en calendario | La celda destino la recibe; si destino ocupado por otra distinta, la evicciona |

### NuevoPeriodoModal

Formulario RHF + Zod: `anio` (2020–2030), `instancia` (Verano / 1er Cuatrimestre / 2do Cuatrimestre),
`nombre` opcional. Cuando se abre para continuar una planificación (`planificacionOrigenId` presente),
la instancia por defecto se computa según el origen: si el año avanza (origen = 2do Cuatrimestre)
se preselecciona `Verano`; si es el mismo año, se preselecciona la primera instancia disponible
después del origen. Al confirmar llama a `crearPeriodo`.

### EditarPeriodoModal

Formulario RHF + Zod idéntico a `NuevoPeriodoModal`, pero pre-cargado con los datos del período
activo (`anio`, `instancia`, `nombre`). El título del modal es "Editar planificación" y el botón de
envío dice "Guardar cambios" (variante `warning` = amarillo). Al confirmar llama a
`actualizarPeriodo(periodoId, data)` (PATCH `/api/planificacion/periodos/:id`) y recarga el
período activo para reflejar los cambios en el header.

### MateriaDisponibleList

Sidebar (w-72) con las materias que el usuario puede planificar. Muestra nombre, código, créditos,
carga horaria, horas asignadas y bloques restantes. Ordenada alfabéticamente por `nombre` via
`useMemo([...materias].sort(...))`. Cada item es draggable: `onDragStart` setea `draggedMateriaId`,
`onDragEnd` limpia `draggedMateriaId` y `draggedFromKey`.

### MateriasDesbloqueablesList (`Extras.tsx`)

Grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) de materias que se desbloquearían al completar
las materias actualmente seleccionadas en el calendario. Se envía `idsSeleccionados` completo al
backend (reemplaza las de DB), por lo que refleja tanto altas como bajas de materias. Ordenada
alfabéticamente por `nombre` via `useMemo`. Si está vacía muestra "No hay materias nuevas por desbloquear".

### Validaciones / Estados

| Regla | Comportamiento |
|---|---|
| Asignación por bloque de 2h | Cada drop asigna 1 bloque (2h). La materia sigue en disponibles hasta completar su `cargaHoraria`. Distribución libre entre días |
| Reemplazo en celda ocupada | Si se suelta una materia sobre una celda ocupada por otra distinta, la reemplaza (evicción con devolución a disponibles) |
| Movimiento de chips existentes | Los chips del calendario son draggables; `moverMateria` los reubica entre celdas. Si el origen no existe (stale), se trata como drop nuevo |
| Cambios sin guardar (`dirty`) | Botones "Descartar"/"Guardar" habilitados; banner de aviso con opacidad (siempre presente, no desplaza layout) |
| **Modales separados** | "Descartar cambios" y "Eliminar período" usan modales **separados** con sus propios estados y mensajes |
| Guardar secuencial | Primero DELETE de `removidas`, luego POST de nuevas; actualiza `planificacionId` en celdas para evitar re-POST |
| Validar bloques completos al guardar | Antes de cualquier llamada API, verifica que cada materia en `celdas` tenga `horasAsignadas >= cargaHoraria`. Si falta algún bloque, lanza error con snackbar "Faltan asignar bloques de una materia" |
| Materia completada — inamovible | Si una materia tiene estado "Completada" en progreso, el chip se muestra en verde opaco con badge "Completada". No se puede eliminar ni arrastrar |
| Eliminación con impacto en hijos | El modal solo se abre al eliminar el **último bloque** de una materia (si tiene más de un bloque, se elimina directamente). Al confirmar, se llama a `eliminarMateriaPlanificada(id, 'cascade')` que borra **todos los bloques** de esa materia en el período actual + todas las materias dependientes (todos sus bloques) en planes hijos. Luego se remueven todos los bloques del store y se invalida cache |
| Materias desbloqueables dinámicas | Se envían todos los `idsSeleccionados` al backend (reemplazan DB). Refleja tanto altas como bajas |
| Persistencia de `planificacionId` tras guardar | Las celdas nuevas reciben el ID real devuelto por el backend. Guardados posteriores no las re-POSTean |
| Orden alfabético en listas | `MateriaDisponibleList` y `MateriasDesbloqueablesList` ordenan por `nombre` con `localeCompare('es')` |
| Limpieza al cambiar carrera | `CarreraSelector` llama `limpiarStore()` al seleccionar otra carrera, reseteando `periodoActivo`, `celdas`, `materiasDisponibles`, `dirty` y `removidas` |
| Sin períodos | `EmptyState` "No hay planificaciones" + botón crear |
| Sin período seleccionado | `EmptyState` "Seleccioná una planificación" |
| **Eliminar período** | Al eliminar, se **limpia primero `periodoActivo` (set null)** y se cancelan/eliminan las queries de materias desbloqueables **antes** de invalidar queries, evitando fetch 404 para período borrado |
| Cargando | `Skeleton` del calendario |
