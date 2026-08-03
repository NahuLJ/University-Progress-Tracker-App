# Refactor de la Página Dashboard — Documento de Implementación

## 0. Estado actual del repo y alcance

Este documento describe el estado **final** del refactor: todo está implementado y verificado
(`npm run lint` y `npm run build` en `frontend` OK, `npx tsc --noEmit` en `backend` OK).

### Implementado (todo `HECHO`)

- `CarreraSelector` en el sidebar de `MainLayout` (`components/layout/CarreraSelector.tsx`).
- Hook `useCarrerasResumen` (`hooks/useCarrerasResumen.ts`) + endpoint `GET /estadisticas/carreras-resumen` (backend).
- `CarrerasResumenList` con `cn()`, selección activa, click handler y estilo Suizo.
- Migración CSS Suizo: tokens en `tailwind.config.ts` y `index.css`, `ProgressBar` con colores semánticos (`'primary' | 'cyan' | 'success' | 'warning' | 'danger'`), prop `className` en `Card`.
- `CarreraSelector` usa `useCarreraStore` (`usuarioCarreraId` / `setUsuarioCarreraId`) para la carrera activa global.
- Backend: filtro de materias inactivas (`planActivo`) en `obtenerResumen` y `obtenerDistribucionEstados`; nuevo campo `materiasDisponibles`; nuevos endpoints `GET /estadisticas/notas-distribucion` y `GET /estadisticas/progreso-por-anio` con sus DTOs.
- Frontend: `useEstadisticas`, `StatCard` genérico + tarjetas nuevas, gráficos (pastel, `NotasDistribucionChart`, `ProgresoPorAnioChart`, `ChartTooltip`), `DashboardPage`, tipos y service.
- Dependencia `recharts@^3.10.1` en `frontend/package.json`.
- Fixes de UX aplicados (sección 4.4 bis): sin subtexto en Materias Aprobadas/Promedio, "materias restantes" debajo de la barra de progreso (total − aprobadas), subtítulo en Distribución de materias, color por barra en notas, "N materias" bajo cada año, y animaciones recharts forzadas.

---

## 1. Resumen del requerimiento

La página Dashboard (`DashboardPage`) se refactoriza en dos ejes principales:

1. **Refactor CSS al Estilo Suizo** — Eliminación completa de efectos neon (sombras glow, gradientes decorativos, `rounded-full`, clases `neon-*`), reemplazo por tokens de diseño Suizo (`bg-bg-surface`, `text-text-muted`, `border-hairline`, `accent-primary`, `status-success/warning/danger`, tipografía mono de 10px para labels, elevación por borde+fondo en vez de sombras). (Todo `HECHO`.)
2. **Refactor estructural y de componentes** — Eliminación del selector de carrera del header de la página (movido al sidebar de `MainLayout` como `CarreraSelector`, `HECHO`), cambio de `useDashboard` directo a `useEstadisticas` (wrapper con estadísticas computadas y los datos de los gráficos nuevos), adición de `useCarrerasResumen` para la lista "Mis carreras" (`HECHO`), nuevas tarjetas (`MateriasAprobadasCard`, `MateriasDisponiblesCard`), nuevos gráficos (`NotasDistribucionChart`, `ProgresoPorAnioChart`), eliminación de `EvolucionPromedioChart`, y refactor de `StatCards`.

### Cambios principales

| Antes | Después |
|---|---|
| 4 tarjetas: Promedio, TiempoRestante, Créditos, Progreso | 4 tarjetas: MateriasAprobadas, Promedio, Créditos, MateriasDisponibles; `ProgresoBarCard` en la segunda fila, ancho completo |
| Selector de carrera en el header del dashboard | Selector movido al sidebar (`CarreraSelector` en `MainLayout`) — `HECHO` |
| `useDashboard` usado directamente en la página | `useEstadisticas` (wrapper) + `useCarrerasResumen` |
| `MateriasPorEstadoChart` como barras verticales (divs) | `MateriasPorEstadoChart` como gráfico de pastel (recharts) |
| Sin gráfico de distribución de notas | `NotasDistribucionChart` (bar chart) + endpoint `GET /estadisticas/notas-distribucion` |
| Sin gráfico de progreso por año | `ProgresoPorAnioChart` (bar chart) + endpoint `GET /estadisticas/progreso-por-anio` |
| `EvolucionPromedioChart` presente | Eliminado del dashboard (el endpoint `/estadisticas/evolucion` queda disponible en el backend, sin uso en el frontend) |
| `PromedioCard` con prop `materiasConNota` y subtítulo de rango | `PromedioCard` simplificado: solo `{ promedio }`, sin subtexto ni `materiasConNota`. Valor `—` sin datos |
| `TiempoRestanteCard` presente | Eliminado (no existe en la versión actual) |
| `MateriasAprobadasCard` muestra `{aprobadas}` + `{porcentaje}% del plan` | Muestra `{aprobadas}/{total}` en `font-mono`, **sin subtexto** (fix UX) |
| `MateriasDisponiblesCard` subtítulo `"Sin nota y con correlativas aprobadas"` | Subtítulo `"pueden cursarse ahora"` |
| Footer de `NotasDistribucionChart` en `text-text-muted` | `text-accent-cyan` (resaltado) |
| `MateriasAprobadasCard` y `PromedioCard` con subtexto | **Fix UX:** sin subtexto (prop `subtext` de `StatCard` es opcional). Solo `MateriasDisponiblesCard` muestra subtexto |
| "materias restantes" como label arriba de la barra en `ProgresoBarCard` | **Fix UX:** movido **debajo** de la barra, como `label mt-2` |
| Fórmula de materias restantes ambiguas | **Fix UX:** `materiasRestantes = totalMaterias − materiasCompletadas` (no descuenta las En Proceso). Se calcula en `DashboardPage` y se pasa como prop |
| `MateriasPorEstadoChart` (pastel) sin subtítulo | **Fix UX:** subtítulo `"Materias según su estado de avance"` en la Card |
| `NotasDistribucionChart` con un solo color para todas las barras | **Fix UX:** color distinto por rango de nota (`COLORES_NOTA`) |
| `ProgresoPorAnioChart` solo con el número de año en el eje | **Fix UX:** debajo de cada año muestra `"N materias"` (total del año) mediante tick personalizado |
| Animaciones recharts con `isAnimationActive="auto"` (recharts las deshabilita con `prefers-reduced-motion`) | **Fix UX:** `isAnimationActive` forzado a `true`, `animationBegin={0}`, pastel 1200ms, barras 900ms `ease-out`, envoltorio `animate-fade-in` |
| Chart tooltips | Ahora siguen el cursor del mouse libremente por el gráfico. `ChartTooltip.tsx` es un componente **nuevo** que usa `coordinate` de Recharts para posicionamiento absoluto |
| Chart cards hover | Fondo no se pone blanco al hover, sino que oscurece levemente (`bg-bg-surface-secondary`) — `hover:bg-bg-surface-secondary transition-colors` |
| Chart sections hover (barras/pastel) | El color no se aclara al hover, sino que oscurece (opacidad 1 + stroke oscuro) — `activeBar` en BarChart y `activeShape` en PieChart con `BAR_ACTIVE_STYLE` y `ActivePieSlice` |
| Clases neon (`shadow-neon-*`, `bg-neon-*/15`, `text-slate-400`) | Tokens Suizo (`bg-accent-primary/10`, `text-text-muted`, `border-hairline`) |
| `CarrerasResumenList` sin estado de selección | `CarrerasResumenList` con `usuarioCarreraIdActivo` y `onSeleccionar` — `HECHO` |
| `StatCards.tsx` sin componente reutilizable | `StatCard` genérico interno usado por las tarjetas de resumen del dashboard |
| `materiasDisponibles` no existía en el backend | Nuevo método privado `calcularMateriasDisponibles` (filtra `materia.activo`, excluye completadas y cuenta correlativas aprobadas) expuesto como campo `materiasDisponibles` en `GET /estadisticas/resumen` |
| `obtenerResumen` incluía materias inactivas en `totalMaterias`, `creditosTotales` e `idsMateriasPlan` | Filtra `planActivo` antes de calcular |
| `obtenerDistribucionEstados` incluía materias inactivas en el total | Filtra `planActivo` antes de calcular conteos |
| Frontend `EstadisticasResumen.materiasTotales` (no coincide con el backend, que devuelve `totalMaterias`) | Tipo corregido: `totalMaterias` + nuevo campo `materiasDisponibles` |
| `recharts` solo en `node_modules` (extraneous) | Agregado a `dependencies` de `package.json` |

> Nota: en versiones previas de este documento se mencionaban `calcularMateriasDisponibles` y `obtenerDistribucionCompleta` como funciones existentes a "corregir". **No existen en el código actual.** `calcularMateriasDisponibles` se debe **crear** (sección 3.2) y el filtro de materias inactivas aplica a `obtenerResumen` y `obtenerDistribucionEstados` (sección 3.1).

---

## 2. Modelo de datos

No se realizan cambios en el modelo de datos. La refactor es de capa de presentación (frontend), lógica de cálculo (backend `estadisticas.service.ts`) y agregado de la dependencia `recharts`.

---

## 3. Backend

> Todo implementado en `backend/src/modules/estadisticas/`. Los snippets de abajo describen el código **final** (no el anterior). Verificación: `npx tsc --noEmit -p tsconfig.json` sin errores.

### 3.1 Corrección: materias inactivas en `obtenerResumen` y `obtenerDistribucionEstados`

Dos métodos de `estadisticas.service.ts` contaban materias desactivadas (baja lógica, `materia.activo = false`) dentro de los totales del plan. Ya corregidos.

#### 3.1.1 `obtenerResumen`

Antes (código previo al fix):
```typescript
const totalMaterias = planEstudios.length;
const creditosTotales = planEstudios.reduce(
  (sum, cm) => sum + (cm.materia?.creditos ?? 0),
  0,
);
const idsMateriasPlan = planEstudios
  .map((cm) => cm.materia?.materiaId)
  .filter((id): id is number => id !== undefined);
```

Después (código final, `planActivo` filtra `materia.activo !== false`):
```typescript
const planActivo = planEstudios.filter((cm) => cm.materia?.activo !== false);
const totalMaterias = planActivo.length;
const creditosTotales = planActivo.reduce(
  (sum, cm) => sum + (cm.materia?.creditos ?? 0),
  0,
);
const idsMateriasPlan = planActivo
  .map((cm) => cm.materia?.materiaId)
  .filter((id): id is number => id !== undefined);
```

`creditosObtenidos` busca el crédito dentro de `planActivo`. `materiasDisponibles` se calcula con `calcularMateriasDisponibles` (ver 3.2) y se agrega al objeto de respuesta.

#### 3.1.2 `obtenerDistribucionEstados`

Antes (código previo al fix):
```typescript
const totalPlan = plan.length;
const idsMateriasPlan = plan
  .map((cm) => cm.materia?.materiaId)
  .filter((id): id is number => id !== undefined);
```

Después (código final):
```typescript
const planActivo = plan.filter((cm) => cm.materia?.activo !== false);
const totalPlan = planActivo.length;
const idsMateriasPlan = planActivo
  .map((cm) => cm.materia?.materiaId)
  .filter((id): id is number => id !== undefined);
```

`pendientes` se calcula contra `totalPlan` (ya filtrado). Los conteos de `completadas` y `enProceso` salen de `progresos` (que se consultan sobre `idsMateriasPlan` filtrados).

### 3.2 Nuevo: campo `materiasDisponibles` en `GET /estadisticas/resumen`

Fuente de datos de `MateriasDisponiblesCard`. Método privado en `estadisticas.service.ts` que cuenta las materias del plan activo que pueden cursarse ahora (activas, sin completar y con todas sus correlativas aprobadas, reutilizando la misma lógica de correlativas que `planificacionService.obtenerMateriasDisponibles`). Se llama desde `obtenerResumen` (tiene `carreraId` y `usuarioId` disponibles) y el campo se agrega a la respuesta y al DTO.

```typescript
private async calcularMateriasDisponibles(
  carreraId: number,
  usuarioId: number,
): Promise<number> {
  const plan = await this.carreraMateriaRepo.find({
    where: { carrera: { carreraId } },
    relations: {
      materia: {
        correlativasRequeridas: { materiaCorrelativa: true, carrera: true },
      },
    },
  });

  const progresos = await this.progresoRepo.find({
    where: { usuario: { usuarioId } },
    relations: { materia: true, estado: true },
  });
  const idsCompletadas = new Set(
    progresos
      .filter((p) => p.estado?.nombre === 'Completada')
      .map((p) => p.materia?.materiaId),
  );

  let disponibles = 0;
  for (const cm of plan) {
    const materia = cm.materia;
    if (!materia?.activo) continue;
    const materiaId = materia.materiaId;
    if (idsCompletadas.has(materiaId)) continue;

    const correlativas = (materia.correlativasRequeridas ?? []).filter(
      (c) => c.carrera.carreraId === carreraId,
    );
    const todasAprobadas = correlativas.every((c) =>
      idsCompletadas.has(c.materiaCorrelativa.materiaId),
    );
    if (todasAprobadas) disponibles++;
  }
  return disponibles;
}
```
> Código final verificado: el método privado `calcularMateriasDisponibles` existe en `estadisticas.service.ts:116`.

### 3.3 Nuevo endpoint: `GET /estadisticas/notas-distribucion`

Devuelve la distribución de notas por rango para `NotasDistribucionChart`. Parámetro: `usuarioCarreraId` (query, `ParseIntPipe`). Implementado en `estadisticas.service.ts:266` y expuesto en `estadisticas.controller.ts:46`.

```typescript
async obtenerNotasDistribucion(
  usuarioCarreraId: number,
): Promise<NotasDistribucionDto> {
  // 1) Obtener inscripción (404 si no existe) -> carreraId + usuarioId
  // 2) Progresos con estado 'Completada' y nota != null
  // 3) Agrupar por rango: '4-5' | '6' | '7' | '8' | '9' | '10'
  const RANGOS = ['4-5', '6', '7', '8', '9', '10'] as const;
  const conteo: Record<string, number> = Object.fromEntries(
    RANGOS.map((r) => [r, 0]),
  );
  for (const p of notasValidas) {
    const nota = p.nota!;
    const rango =
      nota <= 5 ? '4-5'
      : nota === 6 ? '6'
      : nota === 7 ? '7'
      : nota === 8 ? '8'
      : nota === 9 ? '9'
      : '10';
    conteo[rango] += 1;
  }

  return {
    promedioGeneral:
      notasValidas.length > 0
        ? Math.round(
            (notasValidas.reduce((s, p) => s + p.nota!, 0) / notasValidas.length) * 100,
          ) / 100
        : 0,
    materiasConNota: notasValidas.length,
    rangos: RANGOS.map((rango) => ({ rango, cantidad: conteo[rango] })),
  };
}
```

### 3.4 Nuevo endpoint: `GET /estadisticas/progreso-por-anio`

Devuelve materias por año del plan para `ProgresoPorAnioChart`. Parámetro: `usuarioCarreraId` (query, `ParseIntPipe`). Implementado en `estadisticas.service.ts:328` y expuesto en `estadisticas.controller.ts:55`.

```typescript
async obtenerProgresoPorAnio(
  usuarioCarreraId: number,
): Promise<ProgresoPorAnioDto[]> {
  // 1) Obtener inscripción (404 si no existe) -> carreraId + usuarioId
  // 2) Plan activo con relations: { materia: true }, ordenado por anio
  // 3) Progresos del usuario para los ids del plan (relations: { estado: true, materia: true })
  // 4) Agrupar por cm.anio (anios únicos ordenados ascendente):
  //    completadas = progresos 'Completada' de materias de ese año
  //    enProceso   = progresos 'En Proceso' de materias de ese año
  //    pendientes  = max(0, totalMateriasDelAnio - completadas - enProceso)
  // 5) Devolver [{ anio, completadas, enProceso, pendientes }]
}
```

### 3.5 DTOs (implementados)

- `ResumenResponseDto`: incluye `materiasDisponibles: number` (`dto/resumen-carrera.dto.ts`).
- `NotasDistribucionDto`: `{ promedioGeneral: number; materiasConNota: number; rangos: { rango: string; cantidad: number }[] }` (`dto/notas-distribucion.dto.ts`).
- `ProgresoPorAnioDto`: `{ anio: number; completadas: number; enProceso: number; pendientes: number }` (`dto/progreso-por-anio.dto.ts`).

### 3.6 Controller (implementado)

`EstadisticasController` expone las dos rutas nuevas con `@ApiOperation`, `@ApiResponse` y `@ApiBearerAuth` (además de `resumen`, `distribucion-estados`, `evolucion` y `carreras-resumen`):

- `@Get('notas-distribucion')` → `obtenerNotasDistribucion` (`estadisticas.controller.ts:46`)
- `@Get('progreso-por-anio')` → `obtenerProgresoPorAnio` (`estadisticas.controller.ts:55`)

---

## 4. Frontend

### 4.1 Estructura de archivos

```
pages/
└── DashboardPage.tsx              # HECHO: selector removido, useEstadisticas + useCarrerasResumen, nuevo layout

components/dashboard/
├── StatCards.tsx                  # HECHO: StatCard genérico, MateriasAprobadas/MateriasDisponibles, ProgresoBarCard
├── Charts.tsx                     # HECHO: pastel, NotasDistribucionChart, ProgresoPorAnioChart, EstadisticasSkeleton
├── CarrerasResumenList.tsx        # HECHO: cn(), selección activa, click handler, estilo Suizo
└── ChartTooltip.tsx               # HECHO: tooltip que sigue al cursor con `coordinate` de Recharts

hooks/
├── useDashboard.ts                # Sin cambios (ahora usado por useEstadisticas)
├── useEstadisticas.ts             # HECHO: wrapper de useDashboard + queries de los 2 gráficos nuevos
└── useCarrerasResumen.ts          # HECHO: query para resumen por carrera

services/
└── estadisticas.service.ts        # HECHO: + obtenerNotasDistribucion, obtenerProgresoPorAnio

types/
└── estadisticas.types.ts          # HECHO: EstadisticasResumen corregido, + NotasDistribucion y ProgresoPorAnio

components/layout/
└── CarreraSelector.tsx            # HECHO: selector global de carrera en el sidebar

package.json                       # HECHO: + recharts@^3.10.1 en dependencies
```

### 4.2 `DashboardPage` — Refactor estructural

#### Cambios en la página

1. **Selector de carrera removido del header** — `HECHO`: la carrera actual se selecciona desde `CarreraSelector` en el sidebar de `MainLayout`, usando `useCarreraStore` (`usuarioCarreraId` / `setUsuarioCarreraId`).
2. **`useDashboard` → `useEstadisticas`** — `HECHO`: la página usa `useEstadisticas()`, wrapper sobre `useDashboard` que además consulta `notas-distribucion` y `progreso-por-anio` (ver 4.6).
3. **Adición de `useCarrerasResumen`** — `HECHO`: la lista "Mis carreras" usa `useCarrerasResumen()` (`GET /estadisticas/carreras-resumen`) con `materiasCompletadas`, `materiasTotales` y `progresoPorcentaje` reales.
4. **Nuevas tarjetas** — `HECHO`: `TiempoRestanteCard` reemplazada por `MateriasAprobadasCard` y `MateriasDisponiblesCard`.
5. **Grid de tarjetas** — `HECHO`: primer bloque de 4 tarjetas y, en la fila siguiente, un `ProgresoBarCard` de ancho completo.
6. **Header** — `HECHO`: título `"Estadísticas académicas"` + subtítulo `"Resumen general de tu progreso académico, promedios y avance del plan."` + nombre de la carrera activa.

#### Layout actual (final)

```
DashboardPage
├── Header: "Estadísticas académicas" + subtítulo + nombre de carrera activa
├── Grid 4 tarjetas: MateriasAprobadasCard · PromedioCard · CreditosCard · MateriasDisponiblesCard
├── ProgresoBarCard (ancho completo, segunda fila) — "materias restantes: N" debajo de la barra
├── Grid 2 gráficos: MateriasPorEstadoChart (pastel) · NotasDistribucionChart (barras)
├── ProgresoPorAnioChart (ancho completo)
└── CarrerasResumenList ("Mis carreras") con selección activa
```

La tarjeta `TiempoRestanteCard` se eliminó del dashboard. `EvolucionPromedioChart` también se eliminó (su endpoint `/estadisticas/evolucion` permanece en el backend).

### 4.3 `StatCards.tsx` — Refactor de tarjetas

#### `StatCard` — componente genérico reutilizable

Componente interno `StatCard` que encapsula la estructura uniforme de icono + título + valor + subtítulo **opcional**, usado por `MateriasAprobadasCard`, `PromedioCard`, `CreditosCard` y `MateriasDisponiblesCard`.

Props:
```typescript
interface StatCardProps {
    label: string;
    value: string;
    subtext?: string;          // opcional: si no se pasa, no se renderiza
    accentClassName: string;
    iconName: IconName;
}
```

Estructura: `Card.h-full > flex items-start gap-3 > icon chip (rounded-md, shrink-0) > texto`.

> Los icon names `'chart' | 'briefcase' | 'books' | 'trending'` ya existen en `components/ui/icons.ts`.

#### Tarjetas existentes modificadas

| Tarjeta | Cambio |
|---|---|
| `PromedioCard` | `{ promedio }` solamente. **Sin subtexto** (fix UX). Valor `—` si no hay promedio, `promedio.toFixed(2)` con `font-mono`. |
| `CreditosCard` | `{ obtenidos, totales }`. Usa estructura propia (no `StatCard`) por incluir `ProgressBar` inline. Muestra `obtenidos/totales`, barra `color="primary"` y `{porcentaje}% completados` como subtexto. |
| `ProgresoBarCard` | `{ porcentaje, materiasRestantes }`. Gradiente en icono (`from-accent-primary to-accent-cyan`), `%` en `text-accent-cyan` a la derecha del label, barra `ProgressBar color="cyan"`. **"materias restantes: N" se muestra DEBAJO de la barra** (`label mt-2`, fix UX). Solo se renderiza si `materiasRestantes !== undefined`. |

#### Tarjetas nuevas

| Tarjeta | Props | Descripción |
|---|---|---|
| `MateriasAprobadasCard` | `aprobadas: number`, `total: number` | Muestra `{aprobadas}/{total}` como valor. **Sin subtexto** (fix UX). Icono `chart`, acento `status-success`. Se alimenta con `resumen.materiasCompletadas` / `resumen.totalMaterias`. |
| `MateriasDisponiblesCard` | `cantidad: number` | Muestra `{cantidad}` como valor, `"pueden cursarse ahora"` como subtexto. Icono `books`, acento `accent-cyan`. Se alimenta con `resumen.materiasDisponibles`. |

#### Tarjeta eliminada

| Tarjeta | Reemplazada por |
|---|---|
| `TiempoRestanteCard` | No se reemplaza directamente; la información de tiempo estimado queda fuera del resumen principal. |

#### Ajustes de contenido y formato

- **Fix UX:** `PromedioCard` y `MateriasAprobadasCard` NO muestran subtexto. Solo `MateriasDisponiblesCard` lo muestra.
- **Fix UX:** `materiasRestantes` en `ProgresoBarCard` se calcula en `DashboardPage` como `totalMaterias − materiasCompletadas` (no se restan las En Proceso).
- Valores numéricos en `font-mono`.

### 4.4 `Charts.tsx` — Refactor de gráficos

> **Dependencia agregada:** `recharts@^3.10.1` en `dependencies` de `frontend/package.json` (`HECHO`).

#### `MateriasPorEstadoChart` — de barras a pastel

`PieChart` de recharts con `innerRadius={44}`, `outerRadius={72}`, `paddingAngle={2}`, `stroke="#0a0c12"`, tooltip personalizado (`ChartTooltip`), leyenda con dots de círculo y porcentaje (`{cantidad} ({pct}%)`). La Card lleva subtítulo `"Materias según su estado de avance"` (fix UX).

Paleta (sin `'Disponible'`: `obtenerDistribucionEstados` solo devuelve `Completada`, `En Proceso` y `Pendiente`; si más adelante se agrega el estado "Disponible" al backend, se suma acá):
```typescript
type EstadoMateria = 'Completada' | 'En Proceso' | 'Pendiente';

const COLORES: Record<EstadoMateria, string> = {
    Completada: '#10b981',   // status-success
    'En Proceso': '#f59e0b', // status-warning
    Pendiente: '#ef4444',    // status-danger
};
```

> Estos mismos colores se reutilizan en `ProgresoPorAnioChart` (completadas `#10b981`, enProceso `#f59e0b`, pendientes `#ef4444`) para coherencia visual entre gráficos.

#### `NotasDistribucionChart` — nuevo gráfico

Bar chart de recharts sobre `data.rangos` del endpoint `notas-distribucion`. Footer con `promedioGeneral` y `materiasConNota` destacado en `text-accent-cyan`. La card oscurece al hover (`bg-bg-surface-secondary`). Subtítulo de Card: `"Notas de materias aprobadas"`.

Props: `{ data: NotasDistribucion | undefined }`. Si no hay datos o `materiasConNota === 0`, muestra `"Sin notas registradas"`.

**Fix UX — color distinto por barra** (`COLORES_NOTA`, cada rango con su color; acorde a los tokens Suizo):
```typescript
const COLORES_NOTA: Record<string, string> = {
    '4-5': '#64748b', // text-text-muted
    '6': '#8b5cf6',   // violet
    '7': '#3b82f6',   // blue
    '8': '#22d3ee',   // accent-cyan
    '9': '#34d399',   // green
    '10': '#10b981',  // status-success
};
```

#### `ProgresoPorAnioChart` — nuevo gráfico

Bar chart agrupado (`completadas` / `enProceso` / `pendientes` por `anio`) sobre el endpoint `progreso-por-anio`. Colores idénticos a `COLORES` de `MateriasPorEstadoChart`. `radius={[3,3,0,0]}`, `activeBar` con `BAR_ACTIVE_STYLE`. Subtítulo de Card: `"Materias por año del plan"`.

Props: `{ data: ProgresoPorAnio[] }`.

**Fix UX — "N materias" bajo cada año:** el tick del eje X (`XAxis` con `tick={anioTick}`, `interval={0}`, `height={44}`) dibuja el número de año y, debajo, `"{completadas + enProceso + pendientes} materias"` (total del año, en `#94a3b8`).

#### `EvolucionPromedioChart` — eliminado

Eliminado del dashboard. El endpoint `GET /estadisticas/evolucion`, el tipo `EvolucionPromedio` y `obtenerEvolucion` se mantienen en backend y `estadisticas.service.ts` por si se reutilizan.

#### `EstadisticasSkeleton` — actualizado

Skeleton con tokens Suizo (`bg-bg-surface-secondary` en vez de `bg-base-600/70`) que replica el layout completo final: header, grid de 4 tarjetas, `ProgresoBarCard`, grid de 2 gráficos, `ProgresoPorAnioChart` y la lista "Mis carreras". Exportado por `Charts.tsx` y usado por `DashboardPage`.

#### `ChartTooltip` — componente NUEVO

`components/dashboard/ChartTooltip.tsx`. Tooltip de recharts (usado por pastel y barras) que sigue el cursor del mouse usando `coordinate` de Recharts y `position: absolute` para mantener el tooltip alineado con la interacción del usuario.

#### Ajustes de interacción visual

- Footer de `NotasDistribucionChart` en `text-accent-cyan`.
- Cards de gráficos y sus estados vacíos: `hover:bg-bg-surface-secondary transition-colors`.
- Barras y porciones del pastel oscurecen levemente al hover (no aclaran a blanco): `activeBar` en `BarChart` y `activeShape` en `PieChart`, con estilos `BAR_ACTIVE_STYLE` (`stroke: #0a0c12, strokeWidth: 2`) y componente `ActivePieSlice` (expande `outerRadius + 3`).

#### Animaciones (fix UX)

- **`isAnimationActive` forzado a `true`** en `Pie` y en cada `Bar`. Recharts por defecto usa `'auto'`, que deshabilita la animación si el sistema tiene `prefers-reduced-motion`; forzándolo las animaciones se reproducen siempre.
- `animationBegin={0}` para que arranquen al montar (junto con `animate-fade-in` en el envoltorio del gráfico).
- Pastel: `animationDuration={1200}`, `animationEasing="ease-out"`.
- Barras (notas y progreso por año): `animationDuration={900}`, `animationEasing="ease-out"` (las barras crecen desde abajo y el pastel se forma en círculo).

### 4.5 `CarrerasResumenList.tsx` — `HECHO`

Ya implementado con las props y el estilo del estado objetivo:

```typescript
interface CarrerasResumenListProps {
    carreras: any[];
    usuarioCarreraIdActivo?: number | null;
    onSeleccionar?: (usuarioCarreraId: number) => void;
}
```

Usa `cn()` desde `../../utils/cn`, `border-hairline`, `hover:bg-bg-surface-secondary`, selección activa con `bg-accent-primary/10 border-accent-primary/40`, `cursor-pointer` cuando `onSeleccionar` está definido, y muestra `{materiasCompletadas} / {materiasTotales} materias`. No requiere cambios.

### 4.6 `useEstadisticas.ts` — Nuevo hook

Wrapper sobre `useDashboard` que agrega las queries de los dos gráficos nuevos. Es la única fuente de datos de `DashboardPage` (además de `useCarrerasResumen`):

```typescript
export function useEstadisticas() {
    const dashboard = useDashboard();
    const usuarioCarreraId = dashboard.usuarioCarreraId;

    const { data: notasDistribucion } = useQuery({
        queryKey: ['estadisticas', 'notas-distribucion', usuarioCarreraId],
        queryFn: () => estadisticasService.obtenerNotasDistribucion(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    const { data: progresoPorAnio } = useQuery({
        queryKey: ['estadisticas', 'progreso-por-anio', usuarioCarreraId],
        queryFn: () => estadisticasService.obtenerProgresoPorAnio(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    return {
        ...dashboard,
        notasDistribucion,
        progresoPorAnio,
    };
}
```

> Implementación final en `hooks/useEstadisticas.ts` (sin `useMemo`; el spread de `dashboard` ya es estable por React Query).

### 4.7 `useCarrerasResumen.ts` — `HECHO`

Ya existe y coincide con el snippet del estado objetivo:

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

### 4.8 `CarreraSelector.tsx` — `HECHO`

Ya está en el sidebar de `MainLayout`. Botón que despliega el menú de carreras; al elegir una cambia `useCarreraStore` (`usuarioCarreraId`), afectando dashboard, progreso y planificación, y limpia el store de planificación. Opción activa con `bg-accent-primary/10 text-accent-primary`. No requiere cambios.

### 4.9 Service y tipos

#### `estadisticas.service.ts` — `HECHO`

Los dos métodos ya existen siguiendo el patrón existente:

```typescript
async obtenerNotasDistribucion(usuarioCarreraId: number): Promise<NotasDistribucion> {
    const response = await api.get('/estadisticas/notas-distribucion', {
        params: { usuarioCarreraId },
    });
    return response.data;
},

async obtenerProgresoPorAnio(usuarioCarreraId: number): Promise<ProgresoPorAnio[]> {
    const response = await api.get('/estadisticas/progreso-por-anio', {
        params: { usuarioCarreraId },
    });
    return response.data;
},
```

#### `estadisticas.types.ts` — `HECHO`

- `EstadisticasResumen`: usa `totalMaterias` (coincide con el backend `obtenerResumen`) e incluye `materiasDisponibles: number`.
- Agregar:
```typescript
export interface NotasDistribucion {
    promedioGeneral: number;
    materiasConNota: number;
    rangos: { rango: string; cantidad: number }[];
}

export interface ProgresoPorAnio {
    anio: number;
    completadas: number;
    enProceso: number;
    pendientes: number;
}
```

### 4.10 Estilos Suizo aplicados a componentes de dashboard

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
| `bg-status-warning/15` | `#f59e0b` al 15% | Fondo de icon chip de estado en proceso |
| `text-status-warning` | `#f59e0b` | Color de estado en proceso |
| `bg-status-danger/15` | `#ef4444` al 15% | Fondo de icon chip de estado pendiente |
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

| Componente | Acción |
|---|---|
| `TiempoRestanteCard` (en `StatCards.tsx`) | Eliminada |
| `EvolucionPromedioChart` (en `Charts.tsx`) | Eliminado del dashboard; endpoint `/estadisticas/evolucion` y tipo `EvolucionPromedio` se conservan |
| `MateriasPorEstadoChart` (versión barras con divs) | Reemplazada por versión pastel con recharts |

---

## 6. Reglas de negocio

No se aplican reglas de negocio nuevas en el refactor del dashboard. El cálculo de `materiasDisponibles` y de los gráficos reutiliza la lógica existente de correlativas (`planificacionService.obtenerMateriasDisponibles`) y el concepto de nota obligatoria en estado Completada.

---

## 7. Orden de implementación (seguido)

> Todos los pasos están completos y verificados (`npm run lint` y `npm run build` en `frontend` OK, `npx tsc --noEmit` en `backend` OK).

| Paso | Descripción | Archivos |
|---|---|---|
| 1 | Agregar `recharts@^3.10.1` a `dependencies` | `frontend/package.json` |
| 2 | Backend: filtrar `planActivo` en `obtenerResumen` (total, créditos, ids) | `estadisticas.service.ts` |
| 3 | Backend: filtrar `planActivo` en `obtenerDistribucionEstados` | `estadisticas.service.ts` |
| 4 | Backend: crear `calcularMateriasDisponibles` y exponer `materiasDisponibles` en `obtenerResumen` | `estadisticas.service.ts`, `dto/resumen-carrera.dto.ts` |
| 5 | Backend: endpoint `notas-distribucion` + DTO + controller | `estadisticas.service.ts`, `estadisticas.controller.ts`, `dto/notas-distribucion.dto.ts` |
| 6 | Backend: endpoint `progreso-por-anio` + DTO + controller | `estadisticas.service.ts`, `estadisticas.controller.ts`, `dto/progreso-por-anio.dto.ts` |
| 7 | Frontend: corregir `EstadisticasResumen` (`totalMaterias`, `materiasDisponibles`) y agregar `NotasDistribucion` / `ProgresoPorAnio` | `types/estadisticas.types.ts` |
| 8 | Frontend: agregar `obtenerNotasDistribucion` y `obtenerProgresoPorAnio` al service | `services/estadisticas.service.ts` |
| 9 | Refactor `StatCards.tsx`: `StatCard` genérico, `MateriasAprobadasCard`, `MateriasDisponiblesCard`, `ProgresoBarCard`, eliminar `TiempoRestanteCard` | `StatCards.tsx` |
| 10 | Crear `ChartTooltip.tsx` (sigue el cursor con `coordinate`) | `components/dashboard/ChartTooltip.tsx` |
| 11 | Refactor `Charts.tsx`: pastel (sin `'Disponible'`), `NotasDistribucionChart`, `ProgresoPorAnioChart`, eliminar `EvolucionPromedioChart`, `EstadisticasSkeleton`, hover (`activeBar`/`activeShape`) | `Charts.tsx` |
| 12 | Crear `useEstadisticas.ts` (wrapper + queries nuevas) | `hooks/useEstadisticas.ts` |
| 13 | Refactor `DashboardPage.tsx`: usar `useEstadisticas` + `useCarrerasResumen`, nuevo layout, header | `DashboardPage.tsx` |
| 14 | Verificación: `npm run lint` (oxlint) y `npm run build` en `frontend` | — |

Pasos pre-existentes (no requerían trabajo): tokens Suizo y `ProgressBar`/`Card` (paso 0), `CarreraSelector` en `MainLayout`, `useCarrerasResumen`, `CarrerasResumenList`, endpoint `carreras-resumen`.

### Fixes de UX posteriores a la implementación (todos aplicados)

| Fix | Detalle |
|---|---|
| 1 | Quitar subtexto bajo `MateriasAprobadasCard` y `PromedioCard` (`subtext` opcional en `StatCard`) |
| 2 | Mover "materias restantes" debajo de la barra en `ProgresoBarCard` |
| 3 | `materiasRestantes = totalMaterias − materiasCompletadas` (sin descontar En Proceso) |
| 4 | Subtítulo `"Materias según su estado de avance"` en `MateriasPorEstadoChart` |
| 5 | Color por barra en `NotasDistribucionChart` (`COLORES_NOTA`) |
| 6 | `"N materias"` bajo cada año en `ProgresoPorAnioChart` (tick personalizado) |
| 7 | Mismos colores por estado en `ProgresoPorAnioChart` y `MateriasPorEstadoChart` (`pendientes` `#ef4444`) |
| 8 | Animaciones recharts forzadas (`isAnimationActive`, `animationBegin={0}`, duraciones/easing) + `animate-fade-in` |
| 9 | `EstadisticasSkeleton` actualizado al layout final completo |

---

## 8. Notas adicionales

- El `CarreraSelector` en el sidebar reemplaza al selector del header del dashboard (`HECHO`). Al cambiar la carrera desde cualquier página, `usuarioCarreraId` del store global se actualiza y las queries de React Query se refetchean automáticamente por su `queryKey`.
- El hook `useDashboard` sigue existiendo y es utilizado por `useEstadisticas`. No se elimina.
- **`recharts@^3.10.1` está declarado en `frontend/package.json`** (`HECHO`).
- La migración a estilo Suizo se documenta en `docs/implementaciones/refactor-css-estilo-suizo.md`. Los cambios específicos del dashboard están cubiertos en las secciones 7.11 (`StatCards.tsx`), 7.13 (chips inline) y 7.10 (`Charts.tsx`) de ese documento.
- El `ProgressBar` ya acepta `color` semántico (`'primary' | 'cyan' | 'success' | 'warning' | 'danger'`) — `HECHO`. `StatCards.tsx` usa `color="primary"` para Créditos y `ProgresoBarCard` usa `color="cyan"` (gradiente `accent-primary → accent-cyan`), reservando el cyan como color de progreso de carrera del dashboard.
- Los valores numéricos en las tarjetas usan `font-mono`.
- La `Card` ya recibe `className` — `HECHO` — para permitir `h-full` en las tarjetas del grid.
- Mismatch de campos resuelto: el backend `obtenerResumen` devuelve `totalMaterias` (y ahora `materiasDisponibles`), por lo que `EstadisticasResumen` usa esos mismos nombres.
- Los gráficos nuevos dependen de los endpoints `notas-distribucion` y `progreso-por-anio`; sin ellos `useEstadisticas` no tiene datos para `NotasDistribucionChart` ni `ProgresoPorAnioChart`.
- Fixes de UX documentados en 7 bis; todos aplicados en el código final.

---
