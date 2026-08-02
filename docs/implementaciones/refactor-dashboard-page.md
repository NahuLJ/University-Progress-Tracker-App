# Refactor de la Página Dashboard — Documento de Implementación

## 1. Resumen del requerimiento

La página Dashboard (`DashboardPage`) se refactorizó en dos ejes principales:

1. **Refactor CSS al Estilo Suizo** — Eliminación completa de efectos neon (sombras glow, gradientes decorativos, `rounded-full`, clases `neon-*`), reemplazo por tokens de diseño Suizo (`bg-bg-surface`, `text-text-muted`, `border-hairline`, `accent-primary`, `status-success/warning/danger`, tipografía mono de 10px para labels, elevación por borde+fondo en vez de sombras).
2. **Refactor estructural y de componentes** — Eliminación del selector de carrera del header de la página (movido al sidebar de `MainLayout` como `CarreraSelector`), cambio de `useDashboard` directo a `useEstadisticas` (wrapper con estadísticas computadas), adición de `useCarrerasResumen` para la lista "Mis carreras", nuevas tarjetas (`MateriasAprobadasCard`, `MateriasDisponiblesCard`), nuevos gráficos (`NotasDistribucionChart`, `ProgresoPorAnioChart`), y refactor de `StatCards` y `CarrerasResumenList`.

### Cambios principales

| Antes | Después |
|---|---|
| 4 tarjetas: Promedio, TiempoRestante, Créditos, Progreso | 4 tarjetas: MateriasAprobadas, Promedio, Créditos, MateriasDisponibles; ProgresoBarCard en la segunda fila, ancho completo |
| Selector de carrera en el header del dashboard | Selector movido al sidebar (`CarreraSelector` en `MainLayout`) |
| `useDashboard` usado directamente en la página | `useEstadisticas` (wrapper) + `useCarrerasResumen` |
| `MateriasPorEstadoChart` como barras verticales | `MateriasPorEstadoChart` como gráfico de pastel (recharts) |
| Sin gráfico de distribución de notas | `NotasDistribucionChart` (bar chart) |
| Sin gráfico de progreso por año | `ProgresoPorAnioChart` (bar chart) |
| `PromedioCard` con prop `materiasConNota` | `PromedioCard` simplificado, sin `materiasConNota` |
| `TiempoRestanteCard` presente | Eliminado (no existe en la versión actual) |
| `MateriasAprobadasCard` muestra `{aprobadas}` + `{porcentaje}% del plan` | Muestra `{aprobadas}/{total}` + `"materias del plan"` |
| `MateriasDisponiblesCard` subtítulo `"Sin nota y con correlativas aprobadas"` | Subtítulo `"pueden cursarse ahora"` |
| Footer de `NotasDistribucionChart` en `text-text-muted` | `text-accent-cyan` (resaltado) |
| Chart tooltips | Ahora siguen el cursor del mouse libremente por el gráfico (no estáticos ni solo verticales) | `ChartTooltip.tsx` usa `coordinate` de Recharts para posicionamiento absoluto |
| Chart cards hover | Fondo no se pone blanco al hover, sino que oscurece levemente (`bg-bg-surface-secondary`) | `hover:bg-bg-surface-secondary transition-colors` en todas las cards de gráfico |
| Chart sections hover (barras/pastel) | El color no se aclara (blanco) al hover, sino que oscurece levemente (opacidad 1 + stroke oscuro) | `activeBar` en BarChart y `activeShape` en PieChart con estilo `BAR_ACTIVE_STYLE` y componente `ActivePieSlice` |
| Clases neon (`shadow-neon-*`, `bg-neon-*/15`, `text-slate-400`) | Tokens Suizo (`bg-accent-primary/10`, `text-text-muted`, `border-hairline`) |
| `CarrerasResumenList` sin estado de selección | `CarrerasResumenList` con `usuarioCarreraIdActivo` y `onSeleccionar` |
| `StatCards.tsx` sin componente reutilizable | `StatCard` genérico interno usado por las tarjetas de resumen del dashboard |
| `calcularMateriasDisponibles` no filtraba `materia.activo` | Filtra materias inactivas |
| `obtenerDistribucionCompleta` incluía materias inactivas en el total | Filtra `planActivo` antes de calcular conteos |

---

## 2. Modelo de datos

No se realizaron cambios en el modelo de datos. La refactor es exclusivamente de capa de presentación (frontend) y lógica de cálculo (backend).

---

## 3. Backend

### 3.1 Corrección del cálculo de materias disponibles

El cálculo de `materiasDisponibles` en `estadisticas.service.ts` tenía dos problemas:

1. **No filtraba materias inactivas**: `calcularMateriasDisponibles` no verificaba `materia.activo`, por lo que materias desactivadas (baja lógica) podían contarse como disponibles. Se agregó `if (!materia?.activo) continue;` al iterar el plan.

2. **`obtenerDistribucionCompleta` incluía materias inactivas en el total**: El total del plan (`totalPlan`) y los conteos de `completadas`, `enProceso`, `pendientes` y `disponibles` incluían materias con `activo = false`. Se filtró el plan para excluir materias inactivas antes de calcular los conteos.

#### Cambios en `calcularMateriasDisponibles`

```typescript
// Antes: no verificaba materia.activo
for (const carreraMateria of plan) {
    const materiaId = carreraMateria.materia?.materiaId;
    if (!materiaId) continue;

// Después: se verifica materia.activo
for (const carreraMateria of plan) {
    const materia = carreraMateria.materia;
    if (!materia?.activo) continue;
    const materiaId = materia.materiaId;
```

#### Cambios en `obtenerDistribucionCompleta`

```typescript
// Antes: totalPlan incluía materias inactivas
const totalPlan = plan.length;
const idsMateriasPlan = plan.map(...)

// Después: se filtra por materia.activo
const planActivo = plan.filter((cm) => cm.materia?.activo !== false);
const totalPlan = planActivo.length;
const idsMateriasPlan = planActivo.map(...)
```

Todos los filtros posteriores (`completadas`, `enProceso`, `pendientes`) usan `planActivo` en lugar de `plan`.

---

## 4. Frontend

### 4.1 Estructura de archivos

```
pages/
└── DashboardPage.tsx              # Refactor: selector removido, useEstadisticas + useCarrerasResumen

components/dashboard/
├── StatCards.tsx                  # Refactor: StatCard genérico, nuevas tarjetas, eliminado TiempoRestanteCard
├── Charts.tsx                     # Refactor: pastel en vez de barras, 2 gráficos nuevos, estilo Suizo
└── CarrerasResumenList.tsx        # Refactor: selección activa, click handler, estilo Suizo

hooks/
├── useDashboard.ts                # Sin cambios (ahora usado por useEstadisticas)
├── useEstadisticas.ts             # NUEVA: wrapper de useDashboard con estadísticas computadas
└── useCarrerasResumen.ts          # NUEVA: query para resumen por carrera (lista "Mis carreras")

services/
└── estadisticas.service.ts        # Sin cambios (ya existía)

components/layout/
└── CarreraSelector.tsx            # NUEVO: selector global de carrera en el sidebar
```

### 4.2 `DashboardPage` — Refactor estructural

#### Cambios en la página

1. **Selector de carrera removido del header** — El `<select>` de carrera que vivía en el header del dashboard se eliminó. La carrera actual se selecciona ahora desde el `CarreraSelector` en el sidebar de `MainLayout`, usando el store global `useCarreraStore` (`usuarioCarreraId` / `setUsuarioCarreraId`).

2. **`useDashboard` → `useEstadisticas`** — La página dejó de usar `useDashboard` directamente. Ahora usa `useEstadisticas()` que es un `useMemo` wrapper sobre `useDashboard`, agregando propiedades computadas (`stats`) con desglose por categoría, conteos de estado, y datos formateados para los gráficos.

3. **Adición de `useCarrerasResumen`** — La lista "Mis carreras" ahora usa `useCarrerasResumen()` que consulta `GET /estadisticas/carreras-resumen` y devuelve para cada inscripción `materiasCompletadas`, `materiasTotales` y `progresoPorcentaje` reales (corrige el bug de mostrar `0/0`).

4. **Nuevas tarjetas** — Se reemplazó `TiempoRestanteCard` por `MateriasAprobadasCard` y `MateriasDisponiblesCard`.

5. **Grid de tarjetas** — Se definió un primer bloque de 4 tarjetas y, en la fila siguiente, un `ProgresoBarCard` de ancho completo para mantener la jerarquía visual del layout final.

6. **Header** — Se agregó una descripción subtítulo bajo el título: `"Resumen general de tu progreso académico, promedios y avance del plan."`

#### Layout actual

```
DashboardPage
├── Header: "Estadísticas académicas" + subtítulo + nombre de carrera activa
├── Grid 4 tarjetas: MateriasAprobadasCard · PromedioCard · CreditosCard · MateriasDisponiblesCard
├── ProgresoBarCard (ancho completo, segunda fila)
├── Grid 2 gráficos: MateriasPorEstadoChart (pastel) · NotasDistribucionChart (barras)
├── ProgresoPorAnioChart (ancho completo)
└── CarrerasResumenList ("Mis carreras") con selección activa
```

La tarjeta `TiempoRestanteCard` fue eliminada del dashboard y su información quedó fuera del resumen principal, alineándose con la versión actual de la interfaz.

### 4.3 `StatCards.tsx` — Refactor de tarjetas

#### `StatCard` — componente genérico reutilizable

Se introdujo un componente interno `StatCard` que encapsula la estructura uniforme de icono + título + valor + subtítulo, usada por `MateriasAprobadasCard`, `PromedioCard`, `CreditosCard` y `MateriasDisponiblesCard`.

Props:
```typescript
interface StatCardProps {
    label: string;
    value: string;
    subtext: string;
    accentClassName: string;
    iconName: 'chart' | 'briefcase' | 'books' | 'trending';
}
```

Estructura: `Card.h-full > flex items-start gap-3 > icon chip (rounded-md, shrink-0) > texto`.

#### Tarjetas existentes modificadas

| Tarjeta | Cambio |
|---|---|
| `PromedioCard` | Eliminada prop `materiasConNota`. Etiqueta según rango como subtítulo (≥8.5 Excelente, ≥7 Bueno, ≥6 Aceptable, Bajo). Sin "Sin datos". Valor con `font-mono`. |
| `CreditosCard` | Sin cambios funcionales. Usa `StatCard` reutilizable. |
| `ProgresoBarCard` | Layout mejorado: gradiente en icono (`from-accent-primary to-accent-cyan`), `materiasRestantes` como label arriba del progress bar, `%` como label al lado. |

#### Tarjetas nuevas

| Tarjeta | Props | Descripción |
|---|---|---|
| `MateriasAprobadasCard` | `aprobadas: number`, `total: number` | Muestra `{aprobadas}/{total}` como valor, `"materias del plan"` como subtítulo. Icono `chart`, acento `status-success`. |
| `MateriasDisponiblesCard` | `cantidad: number` | Muestra `{cantidad}` como valor, `"pueden cursarse ahora"` como subtítulo. Icono `books`, acento `accent-cyan`. |

#### Tarjeta eliminada

| Tarjeta | Reemplazada por |
|---|---|
| `TiempoRestanteCard` | No se reemplaza directamente; la información de tiempo estimado se puede consultar desde la página de planificación o el backend de estadísticas. |

#### Ajustes de contenido y formato

- `PromedioCard` ahora muestra un subtítulo con la etiqueta de rango en lugar de depender de una cantidad de materias y, si no hay datos, representa el valor como `—`.
- `MateriasAprobadasCard` muestra el formato `aprobadas/total` con el subtítulo `materias del plan`.
- `MateriasDisponiblesCard` usa el texto `pueden cursarse ahora` para describir mejor la condición de disponibilidad.

### 4.4 `Charts.tsx` — Refactor de gráficos

#### `MateriasPorEstadoChart` — de barras a pastel

Antes: barras verticales con `Recharts` (bar chart). Después: gráfico de pastel (`PieChart`) con `innerRadius={44}`, `outerRadius={72}`, `paddingAngle={2}`, tooltip personalizado (`ChartTooltip`), leyenda con íconos de círculo.

Paleta de colores actualizada a tokens Suizo:
```typescript
const COLORES: Record<EstadoMateria, string> = {
    Completada: '#10b981',   // status-success
    'En Proceso': '#f59e0b', // status-warning
    Pendiente: '#ef4444',    // status-danger
    Disponible: '#6366f1',   // accent-primary (futuro)
};
```

#### `NotasDistribucionChart` — nuevo gráfico

Gráfico de barras (`BarChart`) que muestra la distribución de notas por rango de aprobación. Muestra el promedio general y el total de materias con nota en el footer, destacado con `text-accent-cyan`. El fondo de la card oscurece levemente al hover (`bg-bg-surface-secondary`).

Props: `{ data: NotasDistribucion | undefined }`

#### `ProgresoPorAnioChart` — nuevo gráfico

Gráfico de barras agrupadas (`BarChart`) que compara materias pendientes, completadas y en proceso por año del plan de estudios.

Props: `{ data: ProgresoPorAnio[] }`

#### `EstadisticasSkeleton` — actualizado

Skeleton de carga con tokens Suizo (`bg-bg-surface-secondary` en vez de `bg-base-600/70`).

#### Ajustes de interacción visual

- El footer de `NotasDistribucionChart` usa `text-accent-cyan` para resaltar el promedio general y el conteo de materias con nota.
- El `ChartTooltip` fue actualizado para seguir el cursor del mouse libremente, usando `coordinate` de Recharts y `position: absolute` para mantener el tooltip alineado con la interacción del usuario.
- Las cards de gráficos y sus estados vacíos ahora usan `hover:bg-bg-surface-secondary transition-colors`, mientras que las barras y porciones del pastel aplican estilos de hover que oscurecen levemente en lugar de aclarar el color.

### 4.5 `CarrerasResumenList.tsx` — Refactor de la lista de carreras

#### Nuevas props

```typescript
interface CarrerasResumenListProps {
    carreras: any[];
    usuarioCarreraIdActivo?: number | null;
    onSeleccionar?: (usuarioCarreraId: number) => void;
}
```

#### Cambios visuales

| Antes | Después |
|---|---|
| `border-base-600` | `border-hairline` |
| `hover:border-neon-cyan/60 hover:shadow-neon-cyan` | `hover:bg-bg-surface-secondary` |
| Seleccionada: `border-neon-cyan/70 shadow-neon-cyan/20 shadow-sm` | Seleccionada: `bg-accent-primary/10 border-accent-primary/40` |
| `rounded-lg` | `rounded-md` |
| `text-slate-400` | `text-text-muted` |
| `text-sm` para nombre de carrera | `text-sm font-medium` |
| Sin indicador de carrera activa | Borde/accent visual para la carrera activa (`usuarioCarreraId === usuarioCarreraIdActivo`) |
| Click handler ausente | `onClick={onSeleccionar ? () => onSeleccionar(carrera.usuarioCarreraId) : undefined}` |
| `cursor-default` | `cursor-pointer` cuando `onSeleccionar` está definido |
| Sin `materiasCompletadas/materiasTotales` | Se muestra `{materiasCompletadas} / {materiasTotales} materias` |

#### Utilidad `cn()`

Se usa `cn()` desde `../../utils/cn` para clases condicionales en lugar de template strings concatenados.

### 4.6 `useEstadisticas.ts` — Nuevo hook

Wrapper sobre `useDashboard` que agrega propiedades computadas:

```typescript
export function useEstadisticas() {
    const dashboard = useDashboard();

    return useMemo(() => {
        // Conteos de estado
        // Datos para gráficos (pieData, gradeData, byYear)
        // Desglose por categoría (Ciencias Básicas, Ingeniería de Software, Formación General, Obligatoria)
        return { ...dashboard, stats: { ... } };
    }, [dashboard]);
}
```

### 4.7 `useCarrerasResumen.ts` — Nuevo hook

Hook que consulta el endpoint `GET /estadisticas/carreras-resumen` y devuelve para cada inscripción a carrera: `materiasCompletadas`, `materiasTotales`, `progresoPorcentaje`.

```typescript
export function useCarrerasResumen() {
    const usuario = useAuthStore((s) => s.usuario);
    const usuarioId = usuario?.id ?? usuario?.usuarioId;

    return useQuery({
        queryKey: ['estadisticas', 'carreras-resumen', usuarioId],
        queryFn: () => estadisticasService.obtenerCarrerasResumen(usuarioId!),
        enabled: !!usuarioId,
    });
}
```

Este hook reemplaza la lógica previa de mostrar `0/0` en la lista de carreras al exponer los valores reales de progreso por inscripción.

### 4.8 `CarreraSelector.tsx` — Nuevo componente en el sidebar

El selector de carrera se movió del `DashboardPage` al `MainLayout` (sidebar). Es un botón que despliega un menú con la lista de carreras; al elegir una se cambia la carrera actual globalmente (`useCarreraStore`), afectando dashboard, progreso y planificación.

Estilizado con el tema Suizo: opción activa con `bg-accent-primary/15 text-accent-primary`.

### 4.9 Estilos Suizo aplicados a componentes de dashboard

#### Tokens utilizados

| Token | Clase | Uso en dashboard |
|---|---|---|
| `text-text-muted` | `#64748b` | Labels, captions, texto secundario |
| `text-text-default` | `#e2e8f0` | Texto principal, valores numéricos |
| `bg-accent-primary/10` | `#6366f1` al 10% | Fondo de icon chips |
| `text-accent-primary` | `#6366f1` | Color de acento para iconos |
| `bg-accent-primary/15` | `#6366f1` al 15% | Fondo de badge activo |
| `border-accent-primary/40` | `#6366f1` al 40% | Borde de carrera seleccionada |
| `bg-accent-primary/10` | `#6366f1` al 10% | Fondo de carrera seleccionada |
| `bg-status-success/15` | `#10b981` al 15% | Fondo de icon chip de estado positivo |
| `text-status-success` | `#10b981` | Color de estado completada |
| `bg-status-warning/15` | `#f59e0b` al 15% | Fondo de icon chip de estado adverso |
| `text-status-warning` | `#f59e0b` | Color de estado en proceso |
| `bg-status-danger/15` | `#ef4444` al 15% | Fondo de icon chip de estado peligro |
| `text-status-danger` | `#ef4444` | Color de estado pendiente |
| `bg-accent-cyan/15` | `#22d3ee` al 15% | Fondo de icon chip de info |
| `text-accent-cyan` | `#22d3ee` | Color de acento cian |
| `bg-accent-foreground` | `#ffffff` | Texto sobre accent-primary |
| `border-hairline` | `rgba(148,163,184,0.09)` | Borde universal |
| `bg-bg-surface-secondary` | `#1a1f2e` | Hover, skeleton, track de progress |
| `.label` | `text-[10px] font-mono uppercase tracking-widest text-text-muted` | Labels de sección, captions |
| `font-mono` | JetBrains Mono | Valores numéricos |
| `rounded-md` | `border-radius: 6px` | Bordes de cards e icon chips |
| `rounded-full` | Solo en barras de progreso | Indicadores y spinner |

#### Clases eliminadas

- `shadow-neon-*` (todas las sombras glow)
- `bg-neon-*/15` → `bg-accent-*/10` o `bg-status-*/15`
- `text-neon-cyan/green/violet/orange` → `text-accent-primary/status-success`
- `text-slate-400` → `text-text-muted`
- `text-white` → `text-text-default`
- `border-base-600` → `border-hairline`
- `rounded-lg` → `rounded-md`
- `bg-base-600/70` → `bg-bg-surface-secondary`
- `bg-base-600/50` → `bg-bg-surface-secondary`

---

## 5. Eliminación de componentes obsoletos

| Archivo | Acción |
|---|---|
| `components/dashboard/StatCards.tsx` (versión anterior) | Refactor: `TiempoRestanteCard` eliminada, `PromedioCard` simplificada, `StatCard` genérico agregado |
| `components/dashboard/Charts.tsx` (versión anterior) | Refactor: `MateriasPorEstadoChart` cambiado de barras a pastel, `NotasDistribucionChart` y `ProgresoPorAnioChart` agregados |

---

## 6. Reglas de negocio

No se aplican reglas de negocio en la refactor del dashboard (es puramente presentación).

---

## 7. Orden de implementación sugerido

| Paso | Descripción | Archivos |
|---|---|---|
| 1 | Migración CSS a estilo Suizo: tokens en `tailwind.config.ts` y `index.css` | `tailwind.config.ts`, `index.css` |
| 2 | Refactor `StatCards.tsx`: agregar `StatCard` genérico, `MateriasAprobadasCard`, `MateriasDisponiblesCard`, eliminar `TiempoRestanteCard` | `StatCards.tsx` |
| 3 | Refactor `Charts.tsx`: cambiar `MateriasPorEstadoChart` a pastel, agregar `NotasDistribucionChart`, `ProgresoPorAnioChart`, `ChartTooltip` | `Charts.tsx` |
| 4 | Refactor `CarrerasResumenList.tsx`: agregar `cn()`, selección activa, click handler, `usuarioCarreraIdActivo` | `CarrerasResumenList.tsx` |
| 5 | Crear `useEstadisticas.ts` hook | `useEstadisticas.ts` |
| 6 | Crear `useCarrerasResumen.ts` hook | `useCarrerasResumen.ts` |
| 7 | Refactor `DashboardPage.tsx`: remover selector, usar `useEstadisticas` + `useCarrerasResumen`, nuevas tarjetas | `DashboardPage.tsx` |
| 8 | Crear `CarreraSelector.tsx` en `components/layout/` y moverlo al `MainLayout` sidebar | `CarreraSelector.tsx`, `MainLayout.tsx` |
| 9 | Aplicar estilos Suizo a `DashboardPage.tsx` y `MainLayout.tsx` | `DashboardPage.tsx`, `MainLayout.tsx` |
| 10 | Aplicar estilos Suizo a `StatCards.tsx` y `Charts.tsx` (si no se hizo en pasos 2-3) | `StatCards.tsx`, `Charts.tsx` |
| 11 | Aplicar estilos Suizo a `CarrerasResumenList.tsx` | `CarrerasResumenList.tsx` |
| 12 | Corregir `calcularMateriasDisponibles` en backend: agregar filtro `materia.activo` | `estadisticas.service.ts` |
| 13 | Corregir `obtenerDistribucionCompleta` en backend: filtrar materias inactivas del total | `estadisticas.service.ts` |
| 14 | Actualizar `ChartTooltip` para seguir el cursor del mouse (`coordinate`) | `ChartTooltip.tsx` |
| 15 | Agregar `hover:bg-bg-surface-secondary` a cards de gráficos | `Charts.tsx` |
| 16 | Agregar `activeBar`/`activeShape` para oscurecer secciones de gráficos en hover | `Charts.tsx` |

---

## 8. Notas adicionales

- El `CarreraSelector` en el sidebar reemplaza al selector de carrera que estaba en el header del dashboard. Al cambiar la carrera desde cualquier página, el `usuarioCarreraId` del store global se actualiza y las queries de React Query se refetch automáticamente por su `queryKey`.
- El hook `useDashboard` sigue existiendo y es utilizado por `useEstadisticas`. No se eliminó, solo se dejó de usar directamente en `DashboardPage`.
- La migración a estilo Suizo se documenta en `docs/implementaciones/refactor-css-estilo-suizo.md`. Los cambios específicos del dashboard están cubiertos en las secciones 7.11 (`StatCards.tsx`), 7.13 (chips inline) y 7.10 (`Charts.tsx`) de ese documento.
- El `ProgressBar` componente fue actualizado para aceptar un prop `color` con valores semánticos (`'primary'`, `'cyan'`, `'success'`, `'warning'`, `'danger'`) en vez de los valores anteriores (`'purple'`, `'orange'`). `StatCards.tsx` usa `color="primary"` para Créditos y Progreso General.
- Los valores numéricos en las tarjetas usan `font-mono` para mantener la alineación y legibilidad tipográfica, siguiendo el principio Suizo de que la tipografía es la decoración.
- El `ProgresoBarCard` usa un gradiente de `accent-primary` a `accent-cyan` en su barra de progreso, reservando el cyan como color de progreso de carrera del dashboard.
- La `Card` componente de UI recibió un `className` prop para permitir `h-full` en las tarjetas del grid, asegurando que todas las tarjetas del dashboard tengan la misma altura.

---

