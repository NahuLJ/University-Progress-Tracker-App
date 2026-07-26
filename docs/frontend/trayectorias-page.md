# Páginas de Trayectorias — Especificación Técnica

> ✅ **Implementado en `frontend/`**

## Rutas

| Ruta | Página | Descripción |
|---|---|---|
| `/trayectorias` | `TrayectoriasPage` | Listado de trayectorias de la carrera activa |
| `/trayectoria/:id` | `TrayectoriaPage` | Detalle de una trayectoria (timeline + árbol) |

## Estructura de Componentes

```
pages/
├── TrayectoriasPage.tsx     # lista de trayectorias (cards)
└── TrayectoriaPage.tsx      # detalle con timeline + árbol

components/planificacion/
├── ArbolTrayectoria.tsx     # árbol de bifurcaciones
└── NuevoPeriodoModal.tsx    # modal de creación (admite trayectoriaId y planificacionOrigenId)

hooks/
├── useTrayectoria.ts        # trayectorias list + mutations + crearPeriodoSucesivo
└── useArbolTrayectoria.ts   # query del árbol (dentro de useTrayectoria.ts)

store/
└── trayectoria.store.ts     # zustand: trayectoriaActiva, arbol
```

## TrayectoriasPage (lista)

### Comportamiento

- Muestra todas las trayectorias de la carrera activa como `TrayectoriaCard`.
- Cada card muestra: nombre, fecha de creación, cantidad de planificaciones.
- Botón "+ Nueva trayectoria" abre modal de creación (RHF + Zod).
- Al crear, invalida `['trayectorias', usuarioCarreraId]`.
- El contador de trayectorias se muestra como chip neon-cyan a la derecha del título.

### Query keys

| Key | Propósito |
|---|---|
| `['trayectorias', usuarioCarreraId]` | Lista de trayectorias |
| `['planificacion']` | Planificaciones (se invalida al eliminar trayectoria) |

## TrayectoriaPage (detalle)

### Componentes

- **Timeline**: lista vertical con puntos conectados. Cada entrada es una planificación (nombre, fecha, cant. materias). Click → navega a `/planificacion/:id`. Botón "Continuar" para crear bifurcación.
- **Árbol de bifurcaciones**: componente `ArbolTrayectoria` que renderiza el árbol de `GET /trayectorias/:id/arbol`.

### Manejo de cambio de carrera

- `useEffect` que observa `trayectoriasList`. Si al cargar la lista filtrada por `usuarioCarreraId` la trayectoria actual no existe, redirige a `/trayectorias`.

### Creación de período sucesivo

`handleCrearSucesivo` llama `planificacionService.crearPeriodo` con `trayectoriaId` y opcionalmente `planificacionOrigenId`. Al éxito:

| Query invalidada | Key |
|---|---|
| Periodos de la trayectoria | `['trayectoria', trayectoriaId]` |
| Árbol | `['trayectoria-arbol', trayectoriaId]` |
| Lista de trayectorias | `['trayectorias', usuarioCarreraId]` |

Luego navega a `/planificacion/:nuevoPeriodoId`.

### Eliminación de período (desde PlanificacionPage)

Al eliminar un período (click en "Eliminar" en `PlanificacionPage`):

1. `setPeriodoActivo(null)` — desactiva queries que dependen del período.
2. `planificacionService.eliminarPeriodo(periodoId)` — DELETE HTTP.
3. En `.then()`:
   - `invalidateQueries(['trayectoria'])` — refresca timeline de la trayectoria.
   - `invalidateQueries(['trayectorias'])` — refresca contador en lista.
   - `invalidateQueries(['planificacion'])` — refresca queries de planificación.
   - `navigate(-1)` — vuelve a la página anterior (trayectoria o lista).

Esto funciona sin 404s porque el backend retorna `[]` en vez de error cuando el período no existe.

## ArbolTrayectoria

Renderiza el árbol de bifurcaciones usando CSS grid. Cada nodo es una card clickeable. Las flechas entre nodos se dibujan con SVG/ CSS borders.

## NuevoPeriodoModal

Acepta props opcionales `trayectoriaId` y `planificacionOrigenId`. Cuando `trayectoriaId` está presente, el modal sabe que se trata de una planificación sucesiva (no independiente).

## Cards con chip de contador

| Página/Sección | Chip |
|---|---|
| TrayectoriasPage título | total de trayectorias |
| TrayectoriaCard | cantidad de planificaciones (texto, no chip) |
| PlanificacionesPage título | total de planificaciones (solo independientes) |
| CarreraDetailPage "Plan de estudios" | total de materias del plan |
| CarreraDetailPage cada "N° Año" | materias de ese año |
| CarreraDetailPage cada "N° Cuatrimestre" | materias de ese cuatrimestre |
| PlanEstudiosAdmin "Materias en el plan" | materias en el plan |
| MateriaCorrelativasAdmin "Correlativas actuales" | correlativas actuales |
