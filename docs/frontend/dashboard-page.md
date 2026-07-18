# Página Dashboard — Especificación Técnica

## Estructura de Componentes

```
pages/
└── DashboardPage.tsx

components/dashboard/
├── PromedioCard.tsx              # Tarjeta con el promedio general
├── TiempoRestanteCard.tsx        # Tarjeta con cuatrimestres restantes estimados
├── CreditosCard.tsx              # Tarjeta con créditos obtenidos vs. totales
├── MateriasPorEstadoChart.tsx    # Gráfico de donut/barra con distribución de estados
├── ProgresoBar.tsx               # Barra de progreso general (porcentaje)
├── CarrerasResumenList.tsx       # Lista de carreras activas con miniestadísticas
├── EvolucionPromedioChart.tsx    # Gráfico de línea con evolución histórica
└── EstadisticasSkeleton.tsx      # Esqueleto de carga mientras se obtienen datos

components/ui/
├── Card.tsx
├── Badge.tsx
├── ProgressBar.tsx
├── Skeleton.tsx
└── StatCard.tsx
```

### Árbol de Composición

```
MainLayout
└── DashboardPage
    ├── Header
    │   ├── Título "Dashboard"
    │   └── Selector de carrera activa (si tiene más de una)
    │
    ├── Grid de Tarjetas (4 columnas)
    │   ├── PromedioCard
    │   │   └── StatCard (promedio general, color verde si >= 7)
    │   ├── TiempoRestanteCard
    │   │   └── StatCard (cuatrimestres restantes + texto "cuatrimestres")
    │   ├── CreditosCard
    │   │   └── StatCard (créditos obtenidos / totales + mini ProgressBar)
    │   └── ProgresoBar
    │       └── ProgressBar (porcentaje global + etiqueta "% completado")
    │
    ├── Fila de Gráficos (2 columnas)
    │   ├── MateriasPorEstadoChart (gráfico de donut)
    │   │   └── Tooltip con conteo por estado
    │   └── EvolucionPromedioChart (gráfico de línea)
    │       └── Tooltip con valor en cada punto
    │
    └── CarrerasResumenList
        ├── CarreraCard (por cada carrera activa)
        │   ├── Nombre de la carrera
        │   ├── Badge con materias completadas / total
        │   └── Mini ProgressBar
        └── EmptyState (si no tiene carreras)
```

---

## Manejo del Estado Local

### Hook Personalizado: `useDashboard`

```typescript
// hooks/useDashboard.ts
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { estadisticasService } from '../services/estadisticas.service';
import { useCarreras } from '../hooks/useCarreras';
import { useAuthStore } from '../store/auth.store';

export function useDashboard() {
    const usuario = useAuthStore((s) => s.usuario);
    const [usuarioCarreraId, setUsuarioCarreraId] = useState<number | null>(null);

    const { data: carreras, isLoading: cargandoCarreras } = useCarreras(usuario?.id);

    // Una vez cargadas las carreras, seleccionar la primera activa por defecto
    useEffect(() => {
        if (carreras && carreras.length > 0 && !usuarioCarreraId) {
            const activa = carreras.find((c) => c.activo);
            if (activa) setUsuarioCarreraId(activa.usuarioCarreraId);
        }
    }, [carreras]);

    const { data: resumen, isLoading: cargandoResumen } = useQuery({
        queryKey: ['estadisticas', 'resumen', usuarioCarreraId],
        queryFn: () => estadisticasService.obtenerResumen(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    const { data: distribucion, isLoading: cargandoDistribucion } = useQuery({
        queryKey: ['estadisticas', 'distribucion', usuarioCarreraId],
        queryFn: () => estadisticasService.obtenerDistribucionEstados(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    const { data: evolucion, isLoading: cargandoEvolucion } = useQuery({
        queryKey: ['estadisticas', 'evolucion', usuarioCarreraId],
        queryFn: () => estadisticasService.obtenerEvolucion(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    return {
        usuario,
        carreras,
        usuarioCarreraId,
        setUsuarioCarreraId,
        resumen,
        distribucion,
        evolucion,
        isLoading: cargandoCarreras || cargandoResumen || cargandoDistribucion || cargandoEvolucion,
    };
}
```

### Estado Global (zustand)

El dashboard no requiere estado global propio. Los datos se obtienen vía React Query y se cachean automáticamente. El selector de carrera activa se mantiene como estado local en el hook.

---

## Comportamiento UX/UI

### DashboardPage

```typescript
// pages/DashboardPage.tsx
export function DashboardPage() {
    const {
        carreras, usuarioCarreraId, setUsuarioCarreraId,
        resumen, distribucion, evolucion, isLoading,
    } = useDashboard();

    if (isLoading) return <EstadisticasSkeleton />;

    // Si el usuario no tiene carreras, mostrar onboarding
    if (carreras?.length === 0) {
        return <EmptyState
            icon="📚"
            title="No tenés carreras registradas"
            description="Inscribite a una carrera para comenzar a seguir tu progreso."
            action={<Link to="/carreras" className="btn-primary">Ver carreras</Link>}
        />;
    }

    return (
        <div className="space-y-6">
            {/* Header + selector de carrera */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                {carreras && carreras.length > 1 && (
                    <select
                        value={usuarioCarreraId ?? ''}
                        onChange={(e) => setUsuarioCarreraId(Number(e.target.value))}
                        className="border rounded-lg p-2"
                    >
                        {carreras.map((c) => (
                            <option key={c.usuarioCarreraId} value={c.usuarioCarreraId}>
                                {c.carrera.nombre}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <PromedioCard promedio={resumen?.promedioGeneral} />
                <TiempoRestanteCard cuatrimestres={resumen?.cuatrimestresRestantes} />
                <CreditosCard
                    obtenidos={resumen?.creditosObtenidos}
                    totales={resumen?.creditosTotales}
                />
                <ProgresoBar porcentaje={resumen?.progresoPorcentaje} />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Distribución de materias">
                    <MateriasPorEstadoChart data={distribucion} />
                </Card>
                <Card title="Evolución del promedio">
                    <EvolucionPromedioChart data={evolucion} />
                </Card>
            </div>

            {/* Resumen de carreras */}
            <Card title="Mis carreras">
                <CarrerasResumenList carreras={carreras} />
            </Card>
        </div>
    );
}
```

### PromedioCard

```
┌─────────────────────────────┐
│  📊 Promedio General        │
│                             │
│      ┌─────┐                │
│      │ 7.83│  ← grande      │
│      └─────┘                │
│    ˉˉˉˉˉˉˉˉˉˉˉ              │
│   de 18 materias            │
│                             │
│  [●  Bueno (≥7)]            │
└─────────────────────────────┘
```

Colores del promedio:
- Rojo (`< 4`): no aplica porque el mínimo es 4
- Naranja (`4-5.99`): "Bajo"
- Amarillo (`6-6.99`): "Aceptable"
- Verde (`7-8.49`): "Bueno"
- Azul (`8.5-10`): "Excelente"

### TiempoRestanteCard

```
┌─────────────────────────────┐
│  ⏳ Tiempo Estimado         │
│                             │
│      ┌─────┐                │
│      │  4  │  ← grande      │
│      └─────┘                │
│   cuatrimestres restantes   │
│                             │
│  ≈ 2 años                   │
└─────────────────────────────┘
```

### MateriasPorEstadoChart (Donut)

```
        ┌──────────┐
        │  ● 18 Completadas  │
        │  ●  5 En Proceso   │
        │  ● 12 Pendientes   │
        └──────────┘
     ╭─────────────╮
     │   🟢 18     │
     │  🟡 5       │
     │  🔴 12      │
     ╰─────────────╯
```

### Estados de Carga

| Estado | Comportamiento |
|---|---|
| `isLoading = true` | `EstadisticasSkeleton`: 4 skeletons de tarjeta + 2 skeletons de gráfico |
| `error` | `Alert` con mensaje de error + botón "Reintentar" que refetch la query |
| `data vacía` | Mensaje "No hay datos disponibles para esta carrera" |
| `success` | Render completo de todos los componentes |

### Selector de Carrera (Multi-carrera)

Si el usuario tiene más de una carrera activa, aparece un `<select>` en el header que permite cambiar entre ellas. Al cambiar, React Query invalida las queries y refetch automáticamente.
