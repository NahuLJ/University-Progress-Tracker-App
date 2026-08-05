# Página Dashboard — Especificación Técnica (implementada)

> **Estado de implementación:** ✅ Completa. `DashboardPage` cablea `StatCards`
> (`MateriasAprobadasCard`/`PromedioCard`/`CreditosCard`/`MateriasDisponiblesCard`/`ProgresoBarCard`),
> `Charts` (`MateriasPorEstadoChart`/`NotasDistribucionChart`/`ProgresoPorAnioChart`/`EstadisticasSkeleton`),
> `CreditosProgresoChart` (progreso del sistema de créditos por actividades) y
> `CarrerasResumenList` con datos reales de `useEstadisticas` (wrapper de `useDashboard` + gráficos nuevos)
> y `useCarrerasResumen` (lista "Mis carreras").
> El selector multi-carrera (en el navbar lateral) cambia `usuarioCarreraId` y React Query refetch
> automáticamente. Sin placeholders ni datos mockeados.

## Estructura de Componentes (real)

```
pages/
└── DashboardPage.tsx              # orquesta el dashboard

components/dashboard/
├── StatCards.tsx                  # StatCard genérico, MateriasAprobadasCard, PromedioCard, CreditosCard, MateriasDisponiblesCard, ProgresoBarCard
├── Charts.tsx                     # MateriasPorEstadoChart (pastel), NotasDistribucionChart, ProgresoPorAnioChart, EstadisticasSkeleton
├── CreditosProgresoChart.tsx      # bar chart obtenidos vs mínimo por categoría del sistema de créditos
├── CarrerasResumenList.tsx        # lista de carreras activas con mini ProgressBar
└── ChartTooltip.tsx               # tooltip que sigue el cursor (position: fixed, x/y opcionales)

components/layout/
└── CarreraSelector.tsx            # selector global de carrera (dropdown en el sidebar)

components/ui/
├── Card.tsx
├── Badge.tsx
├── ProgressBar.tsx
├── Skeleton.tsx
└── Icon.tsx

hooks/
├── useDashboard.ts                # carrera activa + resumen + distribución + evolución (React Query)
├── useEstadisticas.ts             # wrapper de useDashboard + notas-distribucion + progreso-por-anio + creditos-progreso
├── useCarreras.ts                 # carreras del usuario
├── useCarrerasResumen.ts          # resumen por carrera (materias completadas/totales)
├── useTooltipPosition.ts          # clientX/clientY del cursor (gráficos de barras)
└── usePieTooltip.ts               # sector activo del pastel por ángulo del cursor

store/
├── carrera.store.ts               # usuarioCarreraId activo (persistido en localStorage)
└── sidebar.store.ts               # estado colapsado/expandido del sidebar (persistido)

services/estadisticas.service.ts   # obtenerResumen, obtenerDistribucionEstados, obtenerEvolucion, obtenerCarrerasResumen, obtenerNotasDistribucion, obtenerProgresoPorAnio, obtenerCreditosProgreso
```

> **Estado:** `DashboardPage` cablea `StatCards` (`MateriasAprobadasCard`/`PromedioCard`/`CreditosCard`/
> `MateriasDisponiblesCard`/`ProgresoBarCard`), `Charts` (`MateriasPorEstadoChart` pastel/
> `NotasDistribucionChart`/`ProgresoPorAnioChart`), `CreditosProgresoChart` y `CarrerasResumenList`
> con los datos reales de `useEstadisticas` y `useCarrerasResumen`. El selector multi-carrera
> cambia `usuarioCarreraId` y React Query refetch automáticamente. `EvolucionPromedioChart` fue
> eliminado del dashboard y `TiempoRestanteCard` ya no existe.

### Árbol de Composición (objetivo)

```
MainLayout (sidebar lateral izquierdo, colapsable y responsive)
├── Header del sidebar: logo + botón contraer/desplegar
├── CarreraSelector (dropdown global; visible si el usuario tiene >1 carrera)
├── Nav vertical: Dashboard · Carreras · Progreso · Planificación · Admin
├── Datos del usuario (avatar iniciales + nombre + email)
└── Botón Cerrar sesión
└── DashboardPage
    ├── Header: título "Estadísticas académicas" + subtítulo + carrera activa
    ├── Grid de 4 tarjetas: MateriasAprobadasCard · PromedioCard · CreditosCard · MateriasDisponiblesCard
    ├── ProgresoBarCard (ancho completo, "materias restantes: N" debajo de la barra)
    ├── Fila de 2 gráficos: MateriasPorEstadoChart (pastel) · NotasDistribucionChart
    ├── ProgresoPorAnioChart (ancho completo)
    ├── CreditosProgresoChart (progreso del sistema de créditos por actividades)
    └── CarrerasResumenList ("Mis carreras")
```

> **Nota de implementación:** El selector de carrera ya NO vive en `DashboardPage`. Se movió al
> `MainLayout` (sidebar) como `CarreraSelector`, de modo que la carrera actual se puede cambiar
> desde cualquier página. El estado se guarda en un store global (`useCarreraStore`,
> persistido en `localStorage`) y se comparte con todas las páginas (`useDashboard`, progreso,
> planificación, etc.).

---

## Manejo del Estado — `useDashboard` y `useEstadisticas`

```typescript
export function useDashboard() {
    const usuario = useAuthStore((s) => s.usuario);
    const usuarioCarreraId = useCarreraStore((s) => s.usuarioCarreraId);
    const setUsuarioCarreraId = useCarreraStore((s) => s.setUsuarioCarreraId);

    const { data: carreras, isLoading: cargandoCarreras } = useCarreras();
    const hayCarreras = !!carreras && carreras.length > 0;

    useEffect(() => {
        if (!carreras) return;
        if (carreras.length === 0) {
            if (usuarioCarreraId !== null) setUsuarioCarreraId(null);
            return;
        }
        if (!usuarioCarreraId || !carreras.some((c) => c.usuarioCarreraId === usuarioCarreraId)) {
            const activa = carreras.find((c) => c.activo) ?? carreras[0];
            if (activa) setUsuarioCarreraId(activa.usuarioCarreraId);
        }
    }, [carreras, usuarioCarreraId, setUsuarioCarreraId]);

    const { data: resumen, error: errorResumen } = useQuery({
        queryKey: ['estadisticas', 'resumen', usuarioCarreraId],
        queryFn: () => estadisticasService.obtenerResumen(usuarioCarreraId!),
        enabled: !!usuarioCarreraId && hayCarreras,
        placeholderData: (prev) => prev,
    });
    // distribucion → obtenerDistribucionEstados, enabled: !!usuarioCarreraId && hayCarreras
    // evolucion  → obtenerEvolucion, enabled: !!usuarioCarreraId && hayCarreras
}
```

`DashboardPage` usa `useEstadisticas()`, wrapper sobre `useDashboard` que además consulta los dos
gráficos nuevos (ambos `enabled: !!usuarioCarreraId`):

```typescript
export function useEstadisticas() {
    const dashboard = useDashboard();
    const usuarioCarreraId = dashboard.usuarioCarreraId;

    // notasDistribucion → obtenerNotasDistribucion, queryKey ['estadisticas','notas-distribucion',usuarioCarreraId]
    // progresoPorAnio   → obtenerProgresoPorAnio,   queryKey ['estadisticas','progreso-por-anio',usuarioCarreraId]

    return { ...dashboard, notasDistribucion, progresoPorAnio };
}
```

El selector de carrera se guarda en un store global (`useCarreraStore`) persistido en `localStorage`;
al cambiar, las queries se re-ejecutan por su `queryKey`. El hook `useDashboard` lee el
`usuarioCarreraId` del store y:
- Si no hay carreras, limpia `usuarioCarreraId` a `null` y las queries se deshabilitan (evita 404).
- Si hay carreras pero ningún `usuarioCarreraId` válido, selecciona automáticamente la carrera activa
  (o la primera) en `useEffect`.

"Mis carreras" usa `useCarrerasResumen` → `estadisticas/carreras-resumen`, que devuelve para cada
inscripción `materiasCompletadas`, `materiasTotales` y `progresoPorcentaje` reales (corrige el bug
de mostrar `0/0`). Las mutaciones de carrera (`useDesinscribirCarrera`, `useReactivarCarrera`,
`useEliminarCarreraDefinitivamente` en `hooks/useCarreras.ts`) invalidan esta query, por lo que el
dashboard refleja el cambio de estado (activa/inactiva) sin recargar la página.

---

## Componentes de Tarjeta (`StatCards.tsx`)

Todas las tarjetas usan estructura uniforme (icono + título + valor grande + subtítulo **opcional**)
para que iconos y textos queden a la misma altura (`items-start`, `h-full` en el grid). El componente
interno `StatCard` recibe `{ label, value, subtext?, accentClassName, iconName }`; si no se pasa
`subtext`, no se renderiza.

- **MateriasAprobadasCard** `{ aprobadas, total }` — `aprobadas/total` en `font-mono`, icono `chart`,
  acento `bg-status-success/15 text-status-success`. **Sin subtexto**.
- **PromedioCard** `{ promedio }` — `promedio.toFixed(2)` (o `—` sin datos), icono `chart`,
  acento `bg-accent-primary/10 text-accent-primary`. **Sin subtexto**.
- **CreditosCard** `{ obtenidos, totales }` — `obtenidos/totales` + `ProgressBar color="primary"`
  con `{porcentaje}% completados` como subtexto.
- **MateriasDisponiblesCard** `{ cantidad }` — `cantidad` + subtexto `"pueden cursarse ahora"`,
  icono `books`, acento `bg-accent-cyan/15 text-accent-cyan`.
- **ProgresoBarCard** `{ porcentaje, materiasRestantes }` — `%` en `text-accent-cyan` a la derecha
  del label, `ProgressBar color="cyan"`, y **`"materias restantes: N"` debajo de la barra**. En
  `DashboardPage` se pasa `materiasRestantes = totalMaterias − materiasCompletadas` (no descuenta En Proceso).

---

## Gráficos (`Charts.tsx`)

Todos los gráficos usan `recharts@^3.10.1`, tooltip `ChartTooltip` que **sigue el cursor del mouse**,
ejes `#64748b` 12px JetBrains Mono (año en `ProgresoPorAnioChart`: 12px + subtítulo 11px), grid
`rgba(148,163,184,0.09)`, y `isAnimationActive` forzado
a `true` con `animationBegin={0}` (pastel 1200ms, barras 900ms `ease-out`). Cards de gráficos con
`hover:bg-bg-surface-secondary transition-colors`.

- **Tooltip por gráfico** — En barras (`NotasDistribucionChart` y `ProgresoPorAnioChart`) se usa
  `useTooltipPosition` (`clientX/clientY`) y se neutraliza el posicionamiento de recharts con
  `wrapperStyle={{ position: 'fixed', transform: 'none' }}`; el `ChartTooltip` se renderiza con
  `position: fixed` en el cursor. En el pastel (`MateriasPorEstadoChart`) el dato y la posición salen
  del hook `usePieTooltip`, que calcula el sector por **ángulo/radio** del cursor relativo al centro
  (`Math.atan2(-dy, dx)`, convención de recharts: 0° = derecha, 90° = arriba, antihorario); el
  `<Tooltip>` de recharts no se usa para los datos del pastel.
- **MateriasPorEstadoChart** `{ data: { estado, cantidad }[] }` — **PieChart (donut)** con
  `innerRadius={44}`, `outerRadius={72}`, `paddingAngle={2}`, leyenda con dots y porcentaje.
  Paleta: Completada `#10b981` · En Proceso `#f59e0b` · Pendiente `#ef4444`. Subtítulo de Card:
  `"Materias según su estado de avance"`.
- **NotasDistribucionChart** `{ data: NotasDistribucion }` — BarChart de rangos de nota con
  **color por barra** (`COLORES_NOTA`: 4-5 `#64748b`, 6 `#8b5cf6`, 7 `#3b82f6`, 8 `#22d3ee`,
  9 `#34d399`, 10 `#10b981`). Footer con promedio general y materias con nota en `text-accent-cyan`.
  Subtítulo de Card: `"Notas de materias aprobadas"`.
- **ProgresoPorAnioChart** `{ data: ProgresoPorAnio[] }` — BarChart agrupado por año con los mismos
  colores de estado que el pastel. **Tick personalizado que muestra el año y debajo `"N materias"`**
  (total del año). Subtítulo de Card: `"Materias por año del plan"`.
- **EstadisticasSkeleton** — skeletons del layout completo (header, 4 tarjetas, `ProgresoBarCard`,
  2 gráficos, `ProgresoPorAnioChart`, "Mis carreras") para el estado de carga.

---

## Comportamiento UX/UI (estado actual del page)

`DashboardPage` hoy:

1. Si `isLoading` → `EstadisticasSkeleton`.
2. Si `error` → `QueryError` con retry que invalida `['estadisticas']`.
3. Si el usuario no tiene carreras → `EmptyState` con CTA a `/carreras`.
4. Si hay carreras → header y los valores reales en las 4 tarjetas, `ProgresoBarCard`,
   los 3 gráficos (datos del backend vía `useEstadisticas`), más "Mis carreras" con datos reales.

### Selector de Carrera (Multi-carrera)

El `CarreraSelector` vive en el sidebar del `MainLayout` (no en el dashboard). Es un botón que despliega
un menú hacia abajo con la lista de carreras; al elegir una se cambia la carrera actual globalmente
(`useCarreraStore`), afectando dashboard, progreso y planificación. Está estilizado con el tema Suizo
(opción activa: `bg-accent-primary/15 text-accent-primary`). Ver `components/layout/CarreraSelector.tsx`.

### Sidebar responsive

El `MainLayout` es un sidebar lateral fijo (`w-64` expandido / `w-20` colapsado) con botón para
contraer/desplegar (estado en `sidebar.store.ts`, persistido). En pantallas chicas (`< md`) el sidebar
se oculta por defecto y se abre como overlay mediante un botón hamburguesa en la barra superior flotante,
con fondo oscuro (`backdrop`) y cierre al hacer clic afuera o en un link.
