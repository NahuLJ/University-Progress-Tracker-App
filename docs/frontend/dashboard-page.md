# Página Dashboard — Especificación Técnica (implementada)

> **Estado de implementación:** ✅ Completa. `DashboardPage` cablea `StatCards`
> (`PromedioCard`/`TiempoRestanteCard`/`CreditosCard`/`ProgresoBarCard`), `Charts`
> (`MateriasPorEstadoChart`/`EvolucionPromedioChart`) y `CarrerasResumenList` con datos reales de
> `useDashboard` (`resumen`, `distribucion`, `evolucion`) y `useCarrerasResumen` (lista "Mis carreras").
> El selector multi-carrera (en el navbar lateral) cambia `usuarioCarreraId` y React Query refetch
> automáticamente. Sin placeholders ni datos mockeados.

## Estructura de Componentes (real)

```
pages/
└── DashboardPage.tsx              # orquesta el dashboard

components/dashboard/
├── StatCards.tsx                  # PromedioCard, TiempoRestanteCard, CreditosCard, ProgresoBarCard
├── Charts.tsx                     # MateriasPorEstadoChart, EvolucionPromedioChart, EstadisticasSkeleton
└── CarrerasResumenList.tsx        # lista de carreras activas con mini ProgressBar

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
├── useCarreras.ts                 # carreras del usuario
└── useCarrerasResumen.ts          # resumen por carrera (materias completadas/totales)

store/
├── carrera.store.ts               # usuarioCarreraId activo (persistido en localStorage)
└── sidebar.store.ts               # estado colapsado/expandido del sidebar (persistido)

services/estadisticas.service.ts   # obtenerResumen, obtenerDistribucionEstados, obtenerEvolucion, obtenerCarrerasResumen
```

> **Estado:** `DashboardPage` ya cablea `StatCards` (`PromedioCard`/`TiempoRestanteCard`/`CreditosCard`/
> `ProgresoBarCard`), `Charts` (`MateriasPorEstadoChart`/`EvolucionPromedioChart`) y `CarrerasResumenList`
> con los datos reales de `useDashboard` y `useCarrerasResumen`. El selector multi-carrera
> cambia `usuarioCarreraId` y React Query refetch automáticamente.

### Árbol de Composición (objetivo)

```
MainLayout (sidebar lateral izquierdo, colapsable y responsive)
├── Header del sidebar: logo + botón contraer/desplegar
├── CarreraSelector (dropdown global; visible si el usuario tiene >1 carrera)
├── Nav vertical: Dashboard · Carreras · Progreso · Planificación · Admin
├── Datos del usuario (avatar iniciales + nombre + email)
└── Botón Cerrar sesión
└── DashboardPage
    ├── Header: título "Dashboard"
    ├── Grid de 4 tarjetas: PromedioCard · TiempoRestanteCard · CreditosCard · ProgresoBarCard
    ├── Fila de 2 gráficos: MateriasPorEstadoChart · EvolucionPromedioChart
    └── CarrerasResumenList ("Mis carreras")
```

> **Nota de implementación:** El selector de carrera ya NO vive en `DashboardPage`. Se movió al
> `MainLayout` (sidebar) como `CarreraSelector`, de modo que la carrera actual se puede cambiar
> desde cualquier página. El estado se guarda en un store global (`useCarreraStore`,
> persistido en `localStorage`) y se comparte con todas las páginas (`useDashboard`, progreso,
> planificación, etc.).

---

## Manejo del Estado — `useDashboard`

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

Todas las tarjetas usan estructura uniforme (icono + título + valor grande + subtítulo) para que
iconos y textos queden a la misma altura (`items-start`, `h-full` en el grid). No usan `Badge` para
el promedio; la etiqueta (Excelente/Bueno/Aceptable/Bajo) se muestra como subtítulo.

- **PromedioCard** `{ promedio }` — muestra `promedio.toFixed(2)`. Subtítulo: etiqueta según rango
  (≥8.5 Excelente, ≥7 Bueno, ≥6 Aceptable, sino Bajo). Sin "Sin datos" ni "de N materias".
- **TiempoRestanteCard** `{ cuatrimestres }` — muestra `N cuatrimestre(s)` y subtítulo `≈ N años` si ≥2.
- **CreditosCard** `{ obtenidos, totales }` — `obtenidos/totales` + `ProgressBar` con `%` completado.
- **ProgresoBarCard** `{ porcentaje }` — `porcentaje%` + `ProgressBar` de progreso general.

Colores del promedio: `<6` naranja ("Bajo"), `6–6.99` amarillo ("Aceptable"), `7–8.49` verde ("Bueno"), `≥8.5` azul ("Excelente").

---

## Gráficos (`Charts.tsx`)

- **MateriasPorEstadoChart** `{ data: { estado, cantidad, porcentaje }[] }` — barras verticales por estado
  (verde/amarillo/rojo con glow) con altura proporcional a `cantidad/total` y leyenda de colores. Si no hay datos,
  muestra "Sin datos de distribución".
- **EvolucionPromedioChart** `{ data: { cuatrimestre, promedio }[] }` — barras por cuatrimestre con tooltip.
  Si vacío, "Sin datos de evolución".
- **EstadisticasSkeleton** — skeletons de 4 tarjetas + 2 gráficos para el estado de carga.

---

## Comportamiento UX/UI (estado actual del page)

`DashboardPage` hoy:

1. Si `isLoading` → `EstadisticasSkeleton`.
2. Si el usuario no tiene carreras → `EmptyState` con CTA a `/carreras`.
3. Si hay carreras → header y los valores reales en las 4 tarjetas y en los dos bloques
   de gráficos (datos del backend vía `useDashboard`), más "Mis carreras" con datos reales.

### Selector de Carrera (Multi-carrera)

El `CarreraSelector` vive en el sidebar del `MainLayout` (no en el dashboard). Es un botón que despliega
un menú hacia abajo con la lista de carreras; al elegir una se cambia la carrera actual globalmente
(`useCarreraStore`), afectando dashboard, progreso y planificación. Está estilizado con el tema neon
(opción activa: `bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan`). Ver `components/layout/CarreraSelector.tsx`.

### Sidebar responsive

El `MainLayout` es un sidebar lateral fijo (`w-64` expandido / `w-20` colapsado) con botón para
contraer/desplegar (estado en `sidebar.store.ts`, persistido). En pantallas chicas (`< md`) el sidebar
se oculta por defecto y se abre como overlay mediante un botón hamburguesa en la barra superior flotante,
con fondo oscuro (`backdrop`) y cierre al hacer clic afuera o en un link.
