# Páginas de Trayectorias — Especificación Técnica

> ✅ **Implementado en `frontend/`**

## Rutas

| Ruta | Página | Descripción |
|---|---|---|
| `/trayectorias` | `TrayectoriasPage` | Listado de trayectorias de la carrera activa |
| `/trayectoria/:id` | `TrayectoriaPage` | Detalle de una trayectoria (árbol horizontal con cards) |

## Estructura de Componentes

```
pages/
├── TrayectoriasPage.tsx     # lista de trayectorias (cards)
└── TrayectoriaPage.tsx      # detalle con árbol horizontal

components/planificacion/
├── ArbolTrayectoria.tsx     # árbol horizontal con cards + drag-to-scroll
└── NuevoPeriodoModal.tsx    # modal de creación (admite trayectoriaId y planificacionOrigenId)

hooks/
├── useTrayectoria.ts        # trayectorias list + mutations + crearPeriodoSucesivo
└── useArbolTrayectoria.ts   # query del árbol (dentro de useTrayectoria.ts, con refetchOnMount: 'always')

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

### Layout

La página usa flex layout que ocupa todo el viewport (`h-screen overflow-hidden flex flex-col`), con `overflow: hidden` en `document.body` para ocultar las barras de scroll del navegador. Todo el scroll se maneja internamente en el árbol.

Para alinear el contenido con la navbar (sidebar), el root tiene márgenes negativos que compensan el `px-4 sm:px-6 lg:px-8` del layout padre:
```
-ml-4 sm:-ml-6 lg:-ml-8 -mr-4 sm:-mr-6 lg:-mr-8
```
El header mantiene padding propio (`px-4 sm:px-6 lg:px-8`) para que el título y botones no queden contra el borde.

### Componentes

- **Árbol horizontal** (única vista): componente `ArbolTrayectoria` que renderiza el árbol de `GET /trayectorias/:id/arbol`. Cada nodo es una card con estilo `PlanificacionCard` (nombre, badge año/instancia, lista de materias, botones "Ver planificación" y "+ Continuar"). Layout izquierda→derecha con conectores CSS.
- **Sin botón "+ Nueva planificación" global**: Solo se crean periodos como continuación de otro existente (botón "Continuar" por período) o como el primero de la trayectoria (botón "Crear primera planificación" en EmptyState).
- **La línea de tiempo fue eliminada**: No existed 2 vistas. El árbol horizontal es la única representación, ya que muestra correctamente las bifurcaciones a diferencia del timeline lineal.

### Manejo de cambio de carrera

- `useEffect` que observa `trayectoriasList`. Si al cargar la lista filtrada por `usuarioCarreraId` la trayectoria actual no existe, redirige a `/trayectorias`.

### Refetch del árbol

`useArbolTrayectoria` usa `refetchOnMount: 'always'` para que cada vez que se monta la página (por ejemplo al volver de `PlanificacionPage` tras editar materias), el árbol se refetchea automáticamente y muestra datos actualizados.

### Creación de período sucesivo

`handleCrearSucesivo` llama `planificacionService.crearPeriodo` con `trayectoriaId` y opcionalmente `planificacionOrigenId`. Al éxito:

| Query invalidada | Key |
|---|---|
| Periodos de la trayectoria | `['trayectoria', trayectoriaId]` |
| Árbol | `['trayectoria-arbol', trayectoriaId]` |
| Lista de trayectorias | `['trayectorias', usuarioCarreraId]` |
| Planificaciones | `['planificacion']` |

Luego navega a `/planificacion/:nuevoPeriodoId`.

### Eliminación de período (desde PlanificacionPage)

Al eliminar un período (click en "Eliminar" en `PlanificacionPage`):

1. `setPeriodoActivo(null)` — desactiva queries que dependen del período.
2. `planificacionService.eliminarPeriodo(periodoId)` — DELETE HTTP.
3. En `.then()`:
   - `invalidateQueries(['trayectoria'])` — refresca contador y datos de trayectoria.
   - `invalidateQueries(['trayectorias'])` — refresca contador en lista.
   - `invalidateQueries(['trayectoria-arbol'])` — refresca el árbol de bifurcaciones.
   - `invalidateQueries(['planificacion'])` — refresca queries de planificación.
   - `navigate(-1)` — vuelve a la página anterior (trayectoria o lista).

Esto funciona sin 404s porque el backend retorna `[]` en vez de error cuando el período no existe.

## ArbolTrayectoria

Renderiza el árbol de bifurcaciones en formato horizontal (izquierda→derecha). Cada nodo es una card de 288px (`w-72`) con:

- Header: nombre + badge año/instancia
- Body: lista de materias planificadas (bullet neon-cyan)
- Footer: botón "Ver planificación" (navega a `/planificacion/:id`) y "+ Continuar" (abre modal de período sucesivo)

Las cards se conectan con elementos CSS:
- Línea horizontal padre→hijos: `w-6 h-px bg-neon-cyan/40`
- Barra vertical: `border-l-2 border-neon-cyan/40`
- Conectores a cada hijo: `w-4 h-px bg-neon-cyan/40`

El contenedor tiene `overflow: auto` con `scrollbar-none` (las barras de scroll están ocultas; el scroll es solo con mouse/touch). El drag usa Pointer Events con listeners en `document` (sin `setPointerCapture` para no interferir con clicks en botones). Se aplica un umbral de 4px de movimiento para distinguir click de arrastre.

Para garantizar scroll horizontal incluso con árboles pequeños, el contenido interno usa `min-w-[120%]`.

### Layout de página

Para evitar scrollbars del navegador:
- `TrayectoriaPage` inyecta `document.body.style.overflow = 'hidden'` al montar, lo restaura al desmontar.
- El root de página usa `h-screen overflow-hidden flex flex-col gap-6` con margen negativo para alinear con la sidebar.
- El árbol se envuelve en `flex-1 min-h-0` para ocupar el espacio restante.
- El skeleton replica el mismo layout.

## NuevoPeriodoModal

Acepta props opcionales `trayectoriaId` y `planificacionOrigenId`. Cuando `trayectoriaId` está presente, el modal sabe que se trata de una planificación sucesiva (no independiente).

### Auto-set de año al continuar

Al abrirse el modal (`useEffect` con `isOpen`), se resetea el formulario con el año adecuado según la planificación de origen:

| Instancia origen | Año por defecto |
|---|---|
| Verano | `origenAnio` (mismo año) |
| 1er Cuatrimestre | `origenAnio` (mismo año) |
| 2do Cuatrimestre | `origenAnio + 1` (año siguiente) |

Esto evita que al continuar una planificación de 2do Cuatrimestre no haya instancias disponibles en el mismo año.

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
