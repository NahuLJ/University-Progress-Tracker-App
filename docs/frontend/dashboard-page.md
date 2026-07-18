# Página Dashboard — Especificación Técnica (implementada)

> **Estado de implementación:** ✅ Completa. `DashboardPage` cablea `StatCards`
> (`PromedioCard`/`TiempoRestanteCard`/`CreditosCard`/`ProgresoBarCard`), `Charts`
> (`MateriasPorEstadoChart`/`EvolucionPromedioChart`) y `CarrerasResumenList` con datos reales de
> `useDashboard` (`resumen`, `distribucion`, `evolucion`). El selector multi-carrera cambia
> `usuarioCarreraId` y React Query refetch automáticamente. Sin placeholders ni datos mockeados.

## Estructura de Componentes (real)

```
pages/
└── DashboardPage.tsx              # orquesta el dashboard

components/dashboard/
├── StatCards.tsx                  # PromedioCard, TiempoRestanteCard, CreditosCard, ProgresoBarCard
├── Charts.tsx                     # MateriasPorEstadoChart, EvolucionPromedioChart, EstadisticasSkeleton
└── CarrerasResumenList.tsx        # lista de carreras activas con mini ProgressBar

components/ui/
├── Card.tsx
├── Badge.tsx
├── ProgressBar.tsx
└── Skeleton.tsx

hooks/
└── useDashboard.ts                # carreras + resumen + distribución + evolución (React Query)

services/estadisticas.service.ts   # obtenerResumen, obtenerDistribucionEstados, obtenerEvolucion
```

> **Estado:** `DashboardPage` ya cablea `StatCards` (`PromedioCard`/`TiempoRestanteCard`/`CreditosCard`/
> `ProgresoBarCard`), `Charts` (`MateriasPorEstadoChart`/`EvolucionPromedioChart`) y `CarrerasResumenList`
> con los datos reales de `useDashboard` (`resumen`, `distribucion`, `evolucion`). El selector multi-carrera
> cambia `usuarioCarreraId` y React Query refetch automáticamente.

### Árbol de Composición (objetivo)

```
MainLayout
└── DashboardPage
    ├── Header: título "Dashboard" + selector de carrera (si hay >1)
    ├── Grid de 4 tarjetas: PromedioCard · TiempoRestanteCard · CreditosCard · ProgresoBarCard
    ├── Fila de 2 gráficos: MateriasPorEstadoChart · EvolucionPromedioChart
    └── CarrerasResumenList
```

---

## Manejo del Estado — `useDashboard`

```typescript
export function useDashboard() {
    const usuario = useAuthStore((s) => s.usuario);
    const [usuarioCarreraId, setUsuarioCarreraId] = useState<number | null>(null);

    const { data: carreras } = useCarreras();

    useEffect(() => {
        if (carreras && carreras.length > 0 && !usuarioCarreraId) {
            const activa = carreras.find((c) => c.activo);
            if (activa) setUsuarioCarreraId(activa.usuarioCarreraId);
        }
    }, [carreras]);

    const { data: resumen } = useQuery({
        queryKey: ['estadisticas', 'resumen', usuarioCarreraId],
        queryFn: () => estadisticasService.obtenerResumen(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });
    // distribucion → obtenerDistribucionEstados
    // evolucion  → obtenerEvolucion
}
```

El selector de carrera se guarda en estado local; al cambiar, las queries se re-ejecutan por su `queryKey`.

---

## Componentes de Tarjeta (`StatCards.tsx`)

Cada uno recibe props y usa `Card` + `Badge`/`ProgressBar`:

- **PromedioCard** `{ promedio, materiasConNota }` — badge de color según rango (≥8.5 Excelente, ≥7 Bueno, ≥6 Aceptable, sino Bajo). Muestra `promedio.toFixed(2)`.
- **TiempoRestanteCard** `{ cuatrimestres }` — muestra cantidad y `≈ N años` si ≥2.
- **CreditosCard** `{ obtenidos, totales }` — `ProgressBar` con `%` completado.
- **ProgresoBarCard** `{ porcentaje }` — `ProgressBar` de progreso general.

Colores del promedio: `<6` naranja ("Bajo"), `6–6.99` amarillo ("Aceptable"), `7–8.49` verde ("Bueno"), `≥8.5` azul ("Excelente").

---

## Gráficos (`Charts.tsx`)

- **MateriasPorEstadoChart** `{ data: { estado, cantidad, porcentaje }[] }` — barras verticales por estado
  (verde/amarillo/rojo) con altura proporcional a `cantidad/total` y leyenda de colores. Si no hay datos,
  muestra "Sin datos de distribución".
- **EvolucionPromedioChart** `{ data: { cuatrimestre, promedio }[] }` — barras por cuatrimestre con tooltip.
  Si vacío, "Sin datos de evolución".
- **EstadisticasSkeleton** — skeletons de 4 tarjetas + 2 gráficos para el estado de carga.

---

## Comportamiento UX/UI (estado actual del page)

`DashboardPage` hoy:

1. Si `isLoading` → `EstadisticasSkeleton`.
2. Si el usuario no tiene carreras → `EmptyState` con CTA a `/carreras`.
3. Si hay carreras → header con selector (si >1) y los valores reales en las 4 tarjetas y en los dos bloques
   de gráficos (datos del backend vía `useDashboard`).

### Selector de Carrera (Multi-carrera)

Cuando el usuario tiene más de una carrera activa aparece un `<select>` en el header. Al cambiar,
`useDashboard` invalida/refetch de las queries por `usuarioCarreraId`.
