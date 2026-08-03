# Refactor CSS al Estilo Suizo (International Typographic Style) — Documento de Implementación

## 1. Resumen del requerimiento

Refactorizar el CSS de la app para alinearlo al **Estilo Suizo / International Typographic Style**: fondo muy oscuro monocromático, tipografía funcional (Inter + JetBrains Mono), jerarquía tipográfica estricta con labels mono en mayúsculas de 10px, bordes "hairline" de baja opacidad, sin sombras, sin gradientes decorativos, y color usado **exclusivamente** para comunicar significado (estado, categoría, interacción). Modo oscuro únicamente.

**Motivación:** El estilo visual actual es "neon" (sombras de colores, gradientes, `rounded-full`, texto con `bg-clip-text`), que dificulta la lectura densa de datos académicos y no comunica estado de forma consistente. El estilo Suizo aporta claridad tipográfica, jerarquía por escala/espaciado (no por decoración) y consistencia de estado.

**Principios rectores:**

1. **La tipografía es la decoración.** Sin gradientes, sin sombras, sin fondos decorativos.
2. **Label de 10px mono en mayúsculas** = elemento firma. Se aplica a TODO título de sección, fila de metadata y caption de estadística.
3. **El color comunica, no decora.** Cada acento tiene un significado asignado y no se usa fuera de ese contexto.
4. **Elevación por borde + fondo**, nunca por `box-shadow`.
5. **Sin `rounded-full`** salvo en barras de progreso, indicadores de punto y el spinner de carga.

### 1.1 Eliminación completa de los efectos neon (obligatorio)

Se **eliminan todos los efectos neon** de la app. Esto no es opcional ni se conserva nada del estilo actual:

- **Sombras glow:** todas las clases `shadow-neon-*` (`neon-cyan`, `neon-violet`, `neon-pink`, `neon-green`, `neon-yellow`, `neon-red`, `neon-orange`, `neon-soft`) y cualquier `hover:shadow-[0_0_10px_...]`, `shadow-[...]` con glow. **Cero sombras en toda la app.**
- **Gradientes decorativos:** `neon-text` (texto con `bg-clip-text` y `bg-gradient-to-r`), `backgroundImage.grid-neon` y `radial-glow` del fondo de página, y cualquier otro `bg-gradient-to-r` que no sea el gradiente de progreso de carrera (`progress-fill-gradient`).
- **Backdrop blur "glow":** el `backdrop-blur` solo se conserva en el overlay de modales (blur 4px). El sidebar pasa a fondo sólido `bg-bg-sidebar` sin blur; la barra superior móvil y el sidebar móvil idem (sin `backdrop-blur-md`).
- **Bordes brillantes:** `border-neon-cyan`, `border-2 border-neon-*`, `border-neon-*/60` → reemplazados por `border-hairline` o por el borde del estado activo (`border-accent-primary/40`).
- **Animaciones decorativas:** `pulse-glow` y `float-slow` se eliminan del config; no quedan animaciones que "brillen".
- **Paleta neon:** los tokens `neon.*` se eliminan del `tailwind.config.ts` (no quedan aliases con nombre "neon").

**Criterio de verificación:** en el código final no debe aparecer ninguna clase que contenga `neon`, `shadow`, `glow`, `blur` (salvo modales) ni `bg-clip-text`. Se valida con un grep sobre `frontend/src` antes de dar por cerrada la migración.

---

## 2. Archivos a modificar

| Archivo | Tipo de cambio |
|---|---|
| `frontend/tailwind.config.ts` | Reemplazo de la paleta `base`/`neon` por tokens Suizo, tipografía, radios, animaciones |
| `frontend/src/index.css` | Reescritura completa de `@layer components` y `@layer base` |
| `frontend/src/components/ui/Button.tsx` | Reescribir mapa de variantes (`primary/secondary/outline/ghost/danger/warning/success`) |
| `frontend/src/components/ui/Badge.tsx` | Reescribir variantes (`default/success/warning/danger/info`) |
| `frontend/src/components/ui/StatusBadge.tsx` + `StatusDot` | Reescribir `ESTILOS` (Completada / En Proceso / Pendiente) |
| `frontend/src/components/ui/Input.tsx` | Reescribir `baseInputClass` |
| `frontend/src/components/ui/Select.tsx` | Reescribir trigger y dropdown |
| `frontend/src/components/ui/Modal.tsx` | Quitar `shadow-neon-cyan`, alinear tamaños y header |
| `frontend/src/components/ui/Card.tsx` | Header con label mono, padding 16px, hover a superficie secundaria |
| `frontend/src/components/ui/ProgressBar.tsx` | Ajuste de colores, altura, radio y `showLabel` al nuevo estilo |
| `frontend/src/layouts/MainLayout.tsx` | Sidebar 224px fija, colores nav, avatar y botón logout |
| `frontend/src/components/dashboard/Charts.tsx` | Paleta de barras, ejes, dots sin sombra, labels mono |
| `frontend/src/components/dashboard/StatCards.tsx` | Icon chips sin sombra/neon, captions mono, progress bars |
| `frontend/src/utils/constants.ts` | `ESTADOS_MATERIA` con colores `bg-*-100 text-*-700` → tokens Suizo |
| Páginas/componentes con chips inline (`progreso/index.tsx`, `MateriaProgresoRow.tsx`, `Extras.tsx`, `MateriaPlanificadaChip.tsx`, `CarrerasPage.tsx`, `CarreraDetailPage.tsx`, `PlanificacionesPage.tsx`, `TrayectoriasPage.tsx`, `ErrorBoundary.tsx`, `CarreraSelector.tsx`, Login/Register/NotFound) | Migración de clases inline: `shadow-*`, `bg-neon-*/15`, `rounded-full`, `border-neon-*`, `bg-base-*`, `text-slate-*`, `neon-text` |
| Otros componentes con neon (`Alert.tsx`, `Accordion.tsx`, `Snackbar.tsx`, `EmptyState.tsx`, `LoadingSpinner.tsx`, `PasswordInput.tsx`, `Paginador.tsx`, `RegisterForm.tsx`, `LoginForm.tsx`, `CarreraCard.tsx`, `DesinscribirCarreraModal.tsx`, `InscribirCarreraModal.tsx`, `ConfirmarEliminacionModal.tsx`, `PlanificacionCard.tsx`, `ArbolTrayectoria.tsx`, `BloqueHorarioCelda.tsx`, `MateriaDisponibleList.tsx`, `NuevoPeriodoModal.tsx`, `CarrerasResumenList.tsx` de dashboard y progreso, `ProgresoTree.tsx`, `Filtros.tsx`, `EditarProgresoModal.tsx`, `CompletarMateriaModal.tsx`, `AdminTabs.tsx`, `CarreraEditTabs.tsx`, `CorrelativasEditor.tsx`, `FiltrosModal.tsx`, `PlanificacionPage.tsx`, `TrayectoriaPage.tsx`, `ProgresoPage.tsx`, `TablaMaterias.tsx`, `TablaCarreras.tsx`, `CarreraEditPage.tsx`, `MateriaDetailPage.tsx`, `MateriaEditPage.tsx`) | Migración de clases inline (ver §6.3 y §7.13): shadow/neon/backdrop → tokens Suizo |

> **Alcance:** Este documento define el sistema de diseño y el plan de migración. El refactor de cada página/componente (`src/pages/**`, `src/components/**`) se hace con las utilidades documentadas en las secciones 7 y 8, reemplazando clases por tokens del nuevo sistema.

---

## 3. Nuevo sistema de diseño (Design Tokens)

### 3.1 Paleta de colores

> **Nota de nomenclatura:** los grupos de color se definen como `bg`, `text`, `accent`, `status` y `hairline`. Por eso la clase real lleva el prefijo del grupo más el nombre del token, p.ej. token `bg-page` → clase `bg-bg-page`; token `text-default` → clase `text-text-default`; token `accent-primary` → clase `bg-accent-primary`/`text-accent-primary`.

| Token | Clase Tailwind | Hex | Uso |
|---|---|---|---|
| `bg-page` | `bg-bg-page` | `#0a0c12` | Fondo de página |
| `bg-surface` | `bg-bg-surface` | `#111520` | Cards, paneles, modales |
| `bg-surface-secondary` | `bg-bg-surface-secondary` | `#1a1f2e` | Inputs, hover, áreas muted, track de progress |
| `bg-sidebar` | `bg-bg-sidebar` | `#0d0f18` | Fondo del sidebar (más oscuro que página) |
| `text-default` | `text-text-default` | `#e2e8f0` | Texto principal (off-white) |
| `text-muted` | `text-text-muted` | `#64748b` | Labels, captions, placeholders |
| `text-subtle` | `text-text-subtle` | `#94a3b8` | Información secundaria |
| `accent-primary` | `bg-accent-primary` / `text-accent-primary` | `#6366f1` | Interactivo, activo, focus ring |
| `accent-foreground` | `text-accent-foreground` | `#ffffff` | Texto sobre primary |
| `accent-cyan` | `bg-accent-cyan` / `text-accent-cyan` | `#22d3ee` | Highlights, gradiente de progreso de carrera |
| `status-success` | `bg-status-success` / `text-status-success` | `#10b981` | Aprobado |
| `status-warning` | `bg-status-warning` / `text-status-warning` | `#f59e0b` | En proceso |
| `status-danger` | `bg-status-danger` / `text-status-danger` | `#ef4444` | Error / desaprobado |
| `status-locked` | `bg-status-locked` / `text-status-locked` | `#374151` | Bloqueado / disabled |
| `hairline` | `border-hairline` | `rgba(148,163,184,0.09)` | Hairline universal |
| `hairline-subtle` | `border-hairline-subtle` | `rgba(148,163,184,0.08)` | Hairline del sidebar |
| `focus-ring` | `focus:ring-accent-primary` | `#6366f1` | Anillo de foco (reusa `accent-primary`, sin token propio) |

**Badges — pares fondo/texto (fondo 15% de opacidad del acento, sin borde):**

La app maneja **3 estados reales de materia** (`estado_materia` / `ESTADOS_MATERIA` en `constants.ts`): `Pendiente`, `En Proceso` y `Completada`. Estos son los únicos que existen hoy como badge. "Disponible" y "Bloqueado" no existen todavía como estado; se reservan para planificación/trayectoria a futuro.

| Estado (app) | Clase badge | Fondo | Texto |
|---|---|---|---|
| `Completada` | `badge-success` | `rgba(16,185,129,0.15)` | `#10b981` |
| `En Proceso` | `badge-warning` | `rgba(245,158,11,0.15)` | `#f59e0b` |
| `Pendiente` | `badge-danger` | `rgba(239,68,68,0.15)` | `#ef4444` |
| Neutral / fallback | `badge-gray` | `rgba(100,116,139,0.15)` | `#94a3b8` |
| Info / Disponible (futuro) | `badge-info` | `rgba(99,102,241,0.15)` | `#6366f1` |
| Bloqueado (futuro) | `badge-locked` | `rgba(55,65,81,0.15)` | `#374151` |

> **Nota:** el mapeo del componente `StatusBadge.tsx` actual es `Completada→verde`, `En Proceso→ámbar`, `Pendiente→rojo` (+ fallback gris). Con la migración pasa a `badge-success`, `badge-warning`, `badge-danger` y `badge-gray` respectivamente. Pendiente **no** significa "desaprobado"; usa `danger` por ser el estado de alerta inicial, igual que hoy.

**Chips complementarios definidos en `index.css` (misma capa `components`):**

| Clase | Uso | Estilo |
|---|---|---|
| `.nota-chip` + `.nota-baja` / `.nota-media` / `.nota-alta` | Nota en `MateriaProgresoRow` | Pill mono con `border` del color semántico, fondo 15% + texto acento: rojo 4-6, ámbar 7-8, verde 9-10 |
| `.tipo-chip-final` / `.tipo-chip-promo` | Tipo de aprobación | Badge "Final" (`accent-primary/15`) o "Promoción" (`accent-cyan/15`) |
| `.codigo-chip` | Código de materia | Mono uppercase con tracking, `bg-bg-surface-secondary` + `border-hairline`, texto `accent-primary` |

### 3.2 Tipografía

- Importar en `frontend/index.html` (o vía `@import` en `index.css`):
  - **Inter** — pesos 300, 400, 500, 600
  - **JetBrains Mono** — pesos 400, 500
- Base size: **15px**
- `font-sans` → `'Inter', ui-sans-serif, system-ui, sans-serif`
- `font-mono` → `'JetBrains Mono', ui-monospace, monospace`

**Escala de fuentes (exacta):**

| Rol | Clase Tailwind | Valor |
|---|---|---|
| Título de página / display | `text-lg font-semibold` | 1.125rem (18px), w600 |
| Encabezado de sección | `text-sm font-semibold` | 0.875rem (14px), w600 |
| Cuerpo de texto | `text-xs` | 0.75rem (12px), w400 |
| Label pequeño (firma) | `text-[10px] font-mono font-medium uppercase tracking-widest` | 0.625rem (10px), w500, uppercase, tracking 0.1em |
| Datos mono (números, códigos, %s) | `font-mono text-[10px]` … `text-xs` | JetBrains Mono, 0.625–0.75rem |

> **Regla de oro:** el label de 10px mono en mayúsculas se aplica a TODOS los títulos de sección, filas de metadata y captions de estadísticas. Es la firma visual del estilo.

### 3.3 Espaciado

- Unidad base: **4px**
- Padding interno de card: **16px** (1rem)
- Padding de sección: **24px** (1.5rem)
- Gap entre cards en grid: **12–16px**
- Gap entre elementos inline: **8–12px**
- Whitespace generoso — el contenido debe respirar incluso en layouts densos.

### 3.4 Bordes y radios

| Elemento | Valor |
|---|---|
| Todos los bordes | `1px solid rgba(148,163,184,0.09)` (hairline) |
| Radio de cards/paneles | `0.75rem` (12px) — `rounded-card` |
| Radio de botones/inputs | `0.375rem` (6px) — `rounded-md` |
| Radio de badges/tags | `0.25rem` (4px) — `rounded` |
| Sombras | **Ninguna** (`shadow-none`) — elevación por borde + diferencia de fondo |

### 3.5 Estado de cards

| Estado | Fondo | Borde |
|---|---|---|
| Normal | `#111520` | `rgba(148,163,184,0.09)` |
| Hover | `#1a1f2e` | mismo borde |
| Activo/seleccionado | `rgba(99,102,241,0.10)` | `rgba(99,102,241,0.40)` |

---

## 4. Cambios en `frontend/tailwind.config.ts`

Reemplazar las paletas `base` y `neon` por los tokens Suizo. El resto del archivo (`content`, `plugins`) no cambia. Se eliminan `boxShadow`, `backgroundImage` y `backgroundSize` (sin sombras ni gradientes decorativos).

```ts
import type { Config } from 'tailwindcss';

export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                bg: {
                    page: '#0a0c12',
                    surface: '#111520',
                    'surface-secondary': '#1a1f2e',
                    sidebar: '#0d0f18',
                },
                text: {
                    default: '#e2e8f0',
                    muted: '#64748b',
                    subtle: '#94a3b8',
                },
                accent: {
                    primary: '#6366f1',
                    foreground: '#ffffff',
                    cyan: '#22d3ee',
                },
                status: {
                    success: '#10b981',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                    locked: '#374151',
                },
                hairline: 'rgba(148,163,184,0.09)',
                'hairline-subtle': 'rgba(148,163,184,0.08)',
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
            },
            fontSize: {
                base: '15px',
            },
            borderRadius: {
                card: '0.75rem',
                control: '0.375rem',
                badge: '0.25rem',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
            },
        },
    },
    plugins: [],
} satisfies Config;
```

**Eliminaciones en el config:**

- `boxShadow` completo (`neon-*`, `neon-soft`) → sin sombras.
- `backgroundImage` (`grid-neon`, `radial-glow`) y `backgroundSize.grid` → sin gradientes decorativos.
- `keyframes`/`animation` de `pulse-glow`, `float-slow` y `slide-in` → se eliminan. Se agrega un único `fade-in` (opacity 200ms) para modales y `Snackbar`.
- `base.900…500` y `neon.*` → reemplazados por los tokens de la sección 3.

> **Nota de compatibilidad:** las utilidades antiguas (`bg-base-800`, `text-neon-cyan`, etc.) dejarán de existir. La migración se documenta en la sección 8. No usar ningún token viejo en el nuevo código.

---

## 5. Cambios en `frontend/src/index.css`

### 5.1 Importación de fuentes (en `index.html`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
    rel="stylesheet"
/>
```

### 5.2 `@layer base`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
    * {
        @apply border-hairline;
    }
    html {
        color-scheme: dark;
        font-size: 15px;
    }
    body {
        @apply bg-bg-page text-text-default font-sans antialiased;
        min-height: 100vh;
    }
    h1, h2, h3, h4 {
        @apply text-text-default font-semibold;
    }
    ::selection {
        background: rgba(99, 102, 241, 0.30);
        color: #fff;
    }
}
```

### 5.3 `@layer components`

```css
@layer components {
    /* ---------- Label firma: 10px mono uppercase ---------- */
    .label {
        @apply text-[10px] font-mono font-medium uppercase tracking-widest text-text-muted;
    }

    /* ---------- Botones ---------- */
    .btn-primary {
        @apply inline-flex items-center justify-center gap-2 px-3 py-2
            text-xs font-medium rounded-md
            bg-accent-primary text-accent-foreground
            transition-all duration-150
            hover:opacity-90
            focus:outline-none focus:ring-1 focus:ring-accent-primary
            disabled:opacity-40 disabled:cursor-not-allowed;
    }
    .btn-ghost {
        @apply inline-flex items-center justify-center gap-2 px-3 py-2
            text-xs font-medium rounded-md
            bg-transparent border border-hairline text-text-muted
            transition-all duration-150
            hover:text-text-default hover:border-text-muted/40
            focus:outline-none focus:ring-1 focus:ring-accent-primary
            disabled:opacity-40 disabled:cursor-not-allowed;
    }
    .btn-danger {
        @apply inline-flex items-center justify-center gap-2 px-3 py-2
            text-xs font-medium rounded-md
            bg-transparent border border-hairline text-text-muted
            transition-all duration-150
            hover:text-status-danger hover:border-status-danger/40
            focus:outline-none focus:ring-1 focus:ring-status-danger
            disabled:opacity-40 disabled:cursor-not-allowed;
    }

    /* ---------- Inputs y selects ---------- */
    .input {
        @apply w-full px-3 py-2 text-sm rounded-md
            bg-bg-surface-secondary border border-hairline text-text-default
            placeholder:text-text-muted/50 transition-colors duration-150
            focus:outline-none focus:border-accent-primary
            disabled:bg-bg-surface-secondary disabled:text-text-muted disabled:cursor-not-allowed;
    }
    .input-error {
        @apply border-status-danger/70 focus:border-status-danger;
    }
    .select {
        @apply w-full px-3 py-2 text-sm rounded-md
            bg-bg-surface-secondary border border-hairline text-text-default
            transition-colors duration-150
            focus:outline-none focus:border-accent-primary;
    }
    select option {
        @apply bg-bg-surface text-text-default;
    }

    /* ---------- Cards ---------- */
    .card {
        @apply bg-bg-surface border border-hairline rounded-card;
    }
    .card-header {
        @apply px-4 py-3 border-b border-hairline;
    }
    .card-body {
        @apply p-4;
    }

    /* ---------- Badges (fondo 15% + texto acento, sin borde) ---------- */
    .badge {
        @apply inline-flex items-center gap-1 px-[6px] py-[2px] rounded
            font-mono text-[9px] font-medium;
    }
    .badge-success { @apply badge bg-status-success/15 text-status-success; }
    .badge-warning { @apply badge bg-status-warning/15 text-status-warning; }
    .badge-danger  { @apply badge bg-status-danger/15 text-status-danger; }
    .badge-gray    { @apply badge bg-slate-500/15 text-text-subtle; }
    .badge-info    { @apply badge bg-accent-primary/15 text-accent-primary; }
    .badge-locked  { @apply badge bg-status-locked/15 text-status-locked; }

    /* ---------- Progress bars ---------- */
    .progress-track {
        @apply bg-bg-surface-secondary rounded-full overflow-hidden;
    }
    .progress-fill {
        @apply h-full bg-accent-primary rounded-full transition-[width] duration-500 ease-in-out;
    }
    .progress-fill-gradient {
        @apply bg-gradient-to-r from-accent-primary to-accent-cyan;
    }
}
```

> **Nota (arquitectura real de la app):** la mayor parte del estilo de la app NO vive en estas clases CSS, sino en los **componentes** `frontend/src/components/ui/*` con mapas de clases inline (`Button.tsx`, `Badge.tsx`, `Input.tsx`, `Select.tsx`, `Modal.tsx`, `StatusBadge.tsx`). Las clases `.btn-primary`/`.btn-danger` se usan hoy en unas pocas páginas (`DashboardPage`, `ProgresoPage`, `CarreraDetailPage`, `ErrorBoundary`). `.input`, `.select` y `.badge-*` no las usa ningún `.tsx` actualmente (los componentes llevan sus clases inline) — definirlas aquí sirve para el código nuevo, pero la migración real se hace en los componentes de la sección 7.
>
> **Nota:** el label firma `.label` es el elemento central. En lugar de aplicarlo clase por clase en cada página, conviene definir variantes semanticas si se repite: `.section-label` (encabezado de sección) y `.stat-caption` (caption de estadística), ambas basadas en `.label`.

### 5.4 `@layer utilities`

```css
@layer utilities {
    /* Scrollbars ocultas por defecto */
    .scrollbar-none {
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
    .scrollbar-none::-webkit-scrollbar {
        display: none;
    }

    /* Radio pill exclusivo para progress, dots y el spinner de carga */
    .pill { @apply rounded-full; }
}
```

---

## 6. Código a eliminar (borrar por completo)

Esta sección lista el código **actual** que deja de existir. Tras aplicar la migración no debe quedar ninguna referencia a estas clases o tokens en `frontend/src` (validar con el grep del checklist).

### 6.1 `frontend/tailwind.config.ts` — archivo completo (actual)

Se reemplaza por el de la sección 4. Se eliminan: paletas `base.*` y `neon.*`, `boxShadow` completo, `backgroundImage` (`grid-neon`, `radial-glow`), `backgroundSize.grid`, `keyframes` (`pulse-glow`, `float-slow`, `slide-in`) y `animation`.

```ts
import type { Config } from 'tailwindcss';

export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                base: {
                    900: '#05060a',
                    800: '#0a0e17',
                    700: '#0f1623',
                    600: '#151d2e',
                    500: '#1c2638',
                },
                neon: {
                    cyan: '#22d3ee',
                    blue: '#3b82f6',
                    violet: '#a855f7',
                    pink: '#ec4899',
                    green: '#34d399',
                    yellow: '#facc15',
                    red: '#f87171',
                    orange: '#fb923c',
                },
            },
            boxShadow: {
                'neon-cyan': '0 0 3px rgba(34,211,238,0.35), 0 0 10px rgba(34,211,238,0.12)',
                'neon-violet': '0 0 3px rgba(168,85,247,0.35), 0 0 10px rgba(168,85,247,0.12)',
                'neon-pink': '0 0 3px rgba(236,72,153,0.35), 0 0 10px rgba(236,72,153,0.12)',
                'neon-green': '0 0 3px rgba(52,211,153,0.35), 0 0 10px rgba(52,211,153,0.12)',
                'neon-yellow': '0 0 3px rgba(250,204,21,0.35), 0 0 10px rgba(250,204,21,0.12)',
                'neon-red': '0 0 3px rgba(248,113,113,0.35), 0 0 10px rgba(248,113,113,0.12)',
                'neon-orange': '0 0 3px rgba(251,146,60,0.35), 0 0 10px rgba(251,146,60,0.12)',
                'neon-soft': '0 0 0 1px rgba(34,211,238,0.10), 0 8px 30px rgba(0,0,0,0.4)',
            },
            backgroundImage: {
                'grid-neon':
                    'linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)',
                'radial-glow':
                    'radial-gradient(circle at 50% 0%, rgba(168,85,247,0.10), transparent 60%)',
            },
            backgroundSize: {
                grid: '40px 40px',
            },
            keyframes: {
                'pulse-glow': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.65' },
                },
                'float-slow': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                'slide-in': {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
            },
            animation: {
                'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
                'float-slow': 'float-slow 6s ease-in-out infinite',
                'slide-in': 'slide-in 0.3s ease-out',
            },
        },
    },
    plugins: [],
} satisfies Config;
```

### 6.2 `frontend/src/index.css` — archivo completo (actual)

Se reemplaza por el de la sección 5. Se eliminan: el fondo con `background-image` (`radial-glow` + `grid-neon`), los `@apply border-base-600`/`bg-base-*`/`text-slate-*`/`text-white`, el `::selection` cyan, y las clases `.btn-primary`, `.btn-danger`, `.input`, `.input-error`, `.select`, `.card`, `.card-header`, `.card-body`, `.badge-*`, `.neon-text` y `.scrollbar-thin`.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
    * {
        @apply border-base-600;
    }
    html {
        color-scheme: dark;
    }
    body {
        @apply bg-base-900 text-slate-200 antialiased;
        background-image: theme('backgroundImage.radial-glow'),
            theme('backgroundImage.grid-neon');
        background-size: 100% 100%, theme('backgroundSize.grid'), theme('backgroundSize.grid');
        background-attachment: fixed;
        min-height: 100vh;
    }
    h1, h2, h3, h4 {
        @apply text-white;
    }
    ::selection {
        background: rgba(34, 211, 238, 0.3);
        color: #fff;
    }
}

@layer components {
    .btn-primary {
        @apply inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg
            text-neon-cyan border-2 border-neon-cyan/60 bg-transparent transition-all
            hover:bg-neon-cyan/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.8)]
            focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-base-900
            disabled:opacity-50 disabled:cursor-not-allowed;
    }
    .btn-danger {
        @apply inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg
            text-neon-red border-2 border-neon-red/60 bg-transparent transition-all
            hover:bg-neon-red/10 hover:shadow-[0_0_10px_rgba(248,113,113,0.8)]
            focus:outline-none focus:ring-2 focus:ring-neon-red focus:ring-offset-2 focus:ring-offset-base-900
            disabled:opacity-50 disabled:cursor-not-allowed;
    }

    .input {
        @apply w-full px-3 py-2 bg-base-800/80 border border-base-500 rounded-lg text-slate-100 placeholder:text-slate-500
            shadow-inner transition-colors
            focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan/60
            disabled:bg-base-700 disabled:text-slate-500 disabled:cursor-not-allowed;
    }
    .input-error {
        @apply border-neon-red/70 focus:ring-neon-red focus:border-neon-red/60;
    }

    .card {
        @apply bg-base-800/70 rounded-xl border border-base-600 backdrop-blur-sm shadow-neon-soft;
    }
    .card-header {
        @apply px-6 py-4 border-b border-base-600;
    }
    .card-body {
        @apply p-6;
    }

    .badge-success {
        @apply inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-neon-green/15 text-neon-green border border-neon-green/30;
    }
    .badge-warning {
        @apply inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-neon-yellow/15 text-neon-yellow border border-neon-yellow/30;
    }
    .badge-danger {
        @apply inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-neon-red/15 text-neon-red border border-neon-red/30;
    }
    .badge-info {
        @apply inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30;
    }
    .badge-gray {
        @apply inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-700/40 text-slate-300 border border-slate-600/50;
    }

    .select {
        @apply w-full px-3 py-2 bg-base-800/80 border border-base-500 rounded-lg text-slate-100
            shadow-inner transition-colors
            focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan/60;
    }

    select option {
        @apply bg-base-800 text-slate-100;
    }

    .neon-text {
        @apply text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-pink;
    }
}

@layer utilities {
    .scrollbar-thin {
        scrollbar-width: thin;
        scrollbar-color: theme('colors.base.500') transparent;
    }
    .scrollbar-thin::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    .scrollbar-thin::-webkit-scrollbar-track {
        background: transparent;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb {
        background-color: theme('colors.base.500');
        border-radius: 3px;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background-color: theme('colors.neon.cyan');
    }

    .scrollbar-none {
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
    .scrollbar-none::-webkit-scrollbar {
        display: none;
    }
}
```

> **Ojo:** `.card-header` y `.card-body` ya son código muerto hoy (ningún `.tsx` los usa). Se eliminan, no se conservan. El nuevo CSS de la sección 5 los redefine; solo crearlos si los componentes migrados los utilizan, o no definirlos.

### 6.3 Código puntual a eliminar en componentes `.tsx`

La mayoría del estilo a eliminar está en los **mapas de variantes de los componentes `ui/*`** (sección 7). Ubicaciones exactas del código actual:

| Archivo | Clase / uso actual | Acción |
|---|---|---|
| `frontend/src/components/ui/Button.tsx` | Mapa `variants` (neon + `border-2` + `hover:shadow-[...]`), `sizes`, base `rounded-lg ... focus:ring-offset-base-900` | Reescribir (sección 7.1) |
| `frontend/src/components/ui/Badge.tsx` | Mapa `variants` (`bg-neon-*/15 border border-neon-*/30`), base `rounded-full` | Reescribir (sección 7.2) |
| `frontend/src/components/ui/StatusBadge.tsx` | `ESTILOS` con `bg-neon-*/15 border border-neon-*/30` + `shadow-neon-*` en dots | Reescribir (sección 7.3) |
| `frontend/src/components/ui/Input.tsx` | `baseInputClass` (`bg-base-800/80`, `shadow-inner`, `focus:ring-2 focus:ring-neon-cyan`, `border-base-500`, `border-neon-red/70`, `text-neon-red`) | Reescribir (sección 7.4) |
| `frontend/src/components/ui/Select.tsx` | Trigger (`bg-base-800/80`, `shadow-inner`, `focus:ring-neon-cyan`) + dropdown (`bg-base-800`, `shadow-lg shadow-black/50`, `scrollbar-thin`, opción activa `bg-base-700 text-neon-cyan`) | Reescribir (sección 7.5) |
| `frontend/src/components/ui/Modal.tsx` | `card rounded-xl shadow-neon-cyan`, header `border-base-600`, backdrop `bg-base-900/80`, cierre `hover:text-neon-cyan` | Reescribir (sección 7.7) |
| `frontend/src/components/ui/Card.tsx` | `hover:border-neon-cyan/60 hover:shadow-neon-cyan`, header `border-base-600`, body `p-6` | Reescribir (sección 7.6) |
| `frontend/src/components/ui/ProgressBar.tsx` | fill `bg-neon-* shadow-neon-*` (el color `orange` no lleva shadow), track `h-2 bg-base-600`, `transition-all duration-300` | Reescribir (sección 7.8) |
| `frontend/src/components/dashboard/StatCards.tsx` | Icon chips `bg-neon-cyan/green/violet/orange/15 ... shadow-neon-*` | Reescribir (sección 7.11) |
| `frontend/src/utils/constants.ts` | `ESTADOS_MATERIA` con `bg-red-100 text-red-700`, `bg-yellow-100`, `bg-green-100` y emojis | Reescribir (sección 7.12) |
| `frontend/src/layouts/MainLayout.tsx` (2 usos) | `neon-text` (logo) | Eliminar (texto plano) |
| `frontend/src/layouts/MainLayout.tsx` | NavLink activo `bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan`; avatar `bg-neon-violet/15 text-neon-violet shadow-neon-violet`; logout con glow rojo | Reescribir (sección 7.9) |
| `frontend/src/pages/LoginPage.tsx` / `RegisterPage.tsx` | `neon-text` en h1 | Eliminar |
| `frontend/src/pages/NotFoundPage.tsx` | `neon-text`, `animate-pulse-glow` | Eliminar ambos |
| `frontend/src/components/admin/PlanEstudiosEditor.tsx` | `scrollbar-thin` | Reemplazar por `scrollbar-none` |
| `frontend/src/components/progreso/MateriaProgresoRow.tsx` | `chipClass`/`dotClass` (neon), reset modal `bg-base-900/80` + `card rounded-xl` | Reescribir (sección 7.13 / 7.15) |
| `frontend/src/components/progreso/index.tsx`, `EditarProgresoModal.tsx`, `CompletarMateriaModal.tsx` | Badges inline `bg-neon-*/15 border border-neon-*/30`, `card rounded-xl max-w-md`, backdrops `bg-base-900/80` | Reescribir (sección 7.13 / 7.15) |
| `frontend/src/components/planificacion/Extras.tsx` | Colores `bg-neon-cyan/green/violet/orange/yellow/15 border-neon-*/30` | Reescribir (sección 7.13) |
| `frontend/src/components/planificacion/MateriaPlanificadaChip.tsx` | `bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30` | Reescribir (sección 7.13) |
| `frontend/src/components/carrera/CarrerasPage.tsx`, `CarreraDetailPage.tsx`, `frontend/src/pages/PlanificacionesPage.tsx`, `frontend/src/pages/TrayectoriasPage.tsx` | Contadores `bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30` | `badge badge-info` |
| `frontend/src/components/common/ErrorBoundary.tsx` | `bg-neon-red/15 text-neon-red shadow-neon-soft`, `btn-primary` | Reescribir |
| `frontend/src/components/layout/CarreraSelector.tsx` | Dropdown `card rounded-xl shadow-neon-cyan`; opción activa `border-2 border-neon-cyan/60 ... shadow-[...]`; iconos `text-neon-cyan`; dot `activa ? 'bg-neon-cyan' : 'bg-slate-600'` | Dropdown `card rounded-card` sin sombra; opción activa `bg-accent-primary/10 text-accent-primary`; iconos `text-accent-primary`; dot `bg-accent-primary` / `bg-slate-600` |
| `frontend/src/components/ui/Alert.tsx` | `bg-neon-*/10 border-neon-*/40 text-neon-*` | `bg-status-*/10 border-status-*/40 text-status-*` |
| `frontend/src/components/ui/Accordion.tsx` | `focus:ring-2 focus:ring-neon-cyan focus:ring-inset`, chevron `text-neon-cyan` | `focus:ring-1 focus:ring-accent-primary`, chevron `text-text-muted` |
| `frontend/src/components/ui/Snackbar.tsx` | Contenedor `bg-base-900/95 backdrop-blur shadow-neon-soft animate-slide-in`; mapa `styles` con `border-neon-green/40 text-neon-green`, `border-neon-red/40 text-neon-red`, `border-neon-cyan/40 text-neon-cyan` | Contenedor `bg-bg-surface border-hairline`, sin blur ni sombra, `animate-fade-in` 200ms; `styles` → `border-status-*/40 text-status-*` |
| `frontend/src/components/common/LoadingSpinner.tsx` | `border-neon-cyan border-t-transparent rounded-full animate-spin` (el `border-2`/`border-4` está en el mapa `sizes`) | `border-accent-primary border-t-transparent rounded-full` (mantiene `rounded-full`, es spinner) |
| `frontend/src/components/common/EmptyState.tsx` | `rounded-2xl bg-neon-cyan/10 text-neon-cyan shadow-neon-cyan` | `rounded-xl bg-accent-primary/10 text-accent-primary`, sin sombra |
| `frontend/src/components/auth/RegisterForm.tsx` | Strength bar: `bg-neon-* shadow-neon-* text-neon-*`; link `text-neon-cyan` | `bg-status-* text-status-*` sin sombra; link `text-accent-primary` |
| `frontend/src/components/auth/LoginForm.tsx` | Link `text-neon-cyan` | `text-accent-primary` |
| `frontend/src/components/carrera/CarreraCard.tsx` | `hover:border-neon-cyan/60 hover:shadow-neon-soft`, botón inline `border-2 border-neon-cyan/60 ... hover:shadow-[...]` | `hover:bg-bg-surface-secondary`, botón `btn-primary` |
| `frontend/src/components/carrera/DesinscribirCarreraModal.tsx`, `CarreraDetailPage.tsx` | Botón inline "desinscribir" `border-2 border-neon-yellow/60 ... hover:shadow-[...]` | `btn-danger` |
| `frontend/src/components/planificacion/PlanificacionCard.tsx` | `hover:border-neon-cyan/60 hover:shadow-neon-soft`, dot de período activo `bg-neon-cyan`, botón inline `border-2 border-neon-cyan/60` | `hover:bg-bg-surface-secondary`, dot `bg-accent-primary`, `btn-primary` |
| `frontend/src/components/planificacion/ArbolTrayectoria.tsx` | `hover:border-neon-cyan/60 hover:shadow-neon-soft`, dots `bg-neon-cyan`, botón `border-2 border-neon-cyan/60`, botón secundario `border border-neon-cyan/30 text-neon-cyan/70`, líneas `h-px bg-neon-cyan/40`, conector `border-l-2 border-neon-cyan/40` | `hover:bg-bg-surface-secondary`, dots `bg-accent-primary`, `btn-primary`, secundario `btn-ghost`, líneas `bg-accent-primary/40`, conector `border-l-2 border-accent-primary/40` |
| `frontend/src/components/planificacion/BloqueHorarioCelda.tsx` | `border-2 border-dashed rounded-lg`, no-preview `border-base-500 hover:border-neon-cyan/60`, preview `border-neon-cyan bg-neon-cyan/10` | `border-2 border-dashed border-hairline`, no-preview `hover:border-accent-primary/40`, preview `border-accent-primary/40 bg-accent-primary/10` |
| `frontend/src/components/planificacion/MateriaDisponibleList.tsx` | `text-neon-yellow` (horas restantes) | `text-status-warning` |
| `frontend/src/components/planificacion/NuevoPeriodoModal.tsx` | `bg-neon-cyan/10 border-neon-cyan/30`, aviso `text-neon-yellow` | `bg-accent-primary/10 border-accent-primary/30`, `text-status-warning` |
| `frontend/src/components/progreso/CarrerasResumenList.tsx` | `hover:shadow-neon-cyan`, seleccionada `border-neon-cyan/70 shadow-neon-cyan/20 shadow-sm` | `hover:bg-bg-surface-secondary`, seleccionada `border-accent-primary/40 bg-accent-primary/10` |
| `frontend/src/components/dashboard/CarrerasResumenList.tsx` | `hover:shadow-neon-cyan`, seleccionada `border-neon-cyan/70 shadow-neon-cyan/20 shadow-sm` | ídem progreso/CarrerasResumenList |
| `frontend/src/components/progreso/ProgresoTree.tsx` | Botones inline `border-2 border-neon-cyan/60` / `border-neon-red/60` | `btn-primary` / `btn-danger` |
| `frontend/src/components/progreso/Filtros.tsx` | Filtros `border-2 border-neon-cyan/60` / `border-2 border-base-600`; input búsqueda `bg-base-800/80 border-base-500 ... focus:ring-2 focus:ring-neon-cyan` | `btn-ghost` + estado activo `bg-accent-primary/10 text-accent-primary`; input `.input` |
| `frontend/src/pages/PlanificacionesPage.tsx` | Botón inline "crear planificación" `border-2 border-neon-cyan/60 ... hover:shadow-[...]` | `btn-primary` |
| `frontend/src/pages/PlanificacionPage.tsx` | Links `hover:text-neon-cyan`, svg `text-neon-cyan`, `bg-neon-cyan/10 border-neon-cyan/30`, aviso `bg-neon-yellow/10 border-neon-yellow/40` | `hover:text-accent-primary`, `text-accent-primary`, `bg-accent-primary/10 border-accent-primary/30`, `bg-status-warning/10 border-status-warning/40` |
| `frontend/src/pages/TrayectoriaPage.tsx` | svg `text-neon-cyan` | `text-accent-primary` |
| `frontend/src/pages/ProgresoPage.tsx` | Alerta "Carrera inactiva": `border-neon-red/30 bg-neon-red/5`, icon `bg-neon-red/20`, `text-neon-red` | `border-status-danger/30 bg-status-danger/5`, `bg-status-danger/20`, `text-status-danger` |
| `frontend/src/components/admin/TablaMaterias.tsx`, `TablaCarreras.tsx` | Input búsqueda `bg-base-800/80 ... focus:ring-2 focus:ring-neon-cyan`; iconos `hover:text-neon-cyan` / `hover:text-neon-red`; aviso `bg-neon-yellow/10 border-neon-yellow/30` | `.input` + `focus:ring-accent-primary`; `hover:text-accent-primary` / `hover:text-status-danger`; `bg-status-warning/10 border-status-warning/30` |
| `frontend/src/components/ui/PasswordInput.tsx` | `baseInputClass` idéntico a `Input.tsx` (`bg-base-800/80`, `shadow-inner`, `focus:ring-neon-cyan`, `border-neon-red/70 text-neon-red`), toggle `hover:text-neon-cyan`, error `text-neon-red` | Igual que 7.4; toggle `hover:text-text-default`; error `text-status-danger` |
| `frontend/src/components/ui/Paginador.tsx` | Página activa `bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50` | `bg-accent-primary/15 text-accent-primary border-accent-primary/30` |
| `frontend/src/components/carrera/InscribirCarreraModal.tsx` | Error `text-neon-red` | `text-status-danger` |
| `frontend/src/components/planificacion/ConfirmarEliminacionModal.tsx` | Aviso `bg-neon-yellow/10 border border-neon-yellow/30 text-neon-yellow`; `text-neon-cyan` en periodos sucesores | `bg-status-warning/10 border-status-warning/30 text-status-warning`; `text-accent-primary` |
| `frontend/src/components/admin/AdminTabs.tsx`, `CarreraEditTabs.tsx` | Tab activo `border-neon-cyan text-neon-cyan` | `border-accent-primary text-accent-primary` |
| `frontend/src/components/admin/CorrelativasEditor.tsx` | `hover:text-neon-red` | `hover:text-status-danger` |
| `frontend/src/components/admin/FiltrosModal.tsx` | `bg-base-800 border-base-500 text-neon-cyan` | `bg-bg-surface-secondary border-hairline text-accent-primary` |
| `frontend/src/pages/CarreraEditPage.tsx`, `MateriaEditPage.tsx` | Encabezados de sección `border-l-4 border-neon-cyan` | `border-l-2 border-accent-primary` |
| `frontend/src/pages/MateriaDetailPage.tsx` | Links y encabezados `text-neon-cyan` | `text-accent-primary` |

### 6.4 Patrones globales que deben desaparecer de todo `frontend/src`

(ya mapeados en las secciones 3.1 y 8, pero deben quedar **cero** ocurrencias):

- `shadow-neon-*`, `shadow-neon-soft`, `hover:shadow-[0_0_10px_...]`, `shadow-[...]`, `shadow-inner`, `shadow-lg shadow-black/50`.
- `border-2 border-neon-*`, `border-neon-*/60`.
- `bg-clip-text` y `neon-text`.
- `bg-gradient-to-r` (salvo `progress-fill-gradient` y barras de progreso de carrera).
- `backdrop-blur` (solo se conserva en el overlay de modales).
- `rounded-full` (solo en progress bars, indicadores de punto y el spinner de carga).
- `animate-pulse-glow`, `animate-float-slow`, `animate-slide-in` (el `Snackbar` reemplaza `slide-in` por `fade-in` de 200ms si se conserva).
- `text-neon-*`, `bg-neon-*`, `bg-base-*`, `border-base-*`, `text-slate-*` (tokens eliminados del config).

---

## 7. Componentes clave a ajustar

> El estilo de la app vive en los **mapas de variantes** de cada componente `ui/*`. La migración de cada uno es reescribir esos mapas con los tokens de la sección 3.1. A continuación el antes→después por componente, basado en el código real actual.

### 7.1 `Button.tsx` — mapa de variantes

Antes (neon, borde grueso, glow):

```ts
primary:  'border-2 border-neon-cyan/60 text-neon-cyan bg-transparent hover:bg-neon-cyan/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.8)]',
secondary:'border-2 border-neon-violet/60 text-neon-violet bg-transparent hover:bg-neon-violet/10 hover:shadow-[0_0_10px_rgba(139,92,246,0.8)]',
outline:  'border-2 border-neon-cyan/60 text-neon-cyan bg-transparent hover:bg-neon-cyan/10 hover:shadow-neon-cyan',
ghost:    'text-slate-300 hover:bg-white/5 hover:text-white',
danger:   'border-2 border-neon-red/60 text-neon-red bg-transparent hover:bg-neon-red/10 hover:shadow-[0_0_10px_rgba(248,113,113,0.8)]',
warning:  'border-2 border-neon-yellow/60 text-neon-yellow bg-transparent hover:bg-neon-yellow/10 hover:shadow-[0_0_10px_rgba(251,146,60,0.8)]',
success:  'border-2 border-neon-green/60 text-neon-green bg-transparent hover:bg-neon-green/10 hover:shadow-[0_0_10px_rgba(34,197,94,0.8)]',
// sizes: sm 'px-3 py-1.5 text-sm' | md 'px-4 py-2 text-base' | lg 'px-6 py-3 text-lg'
// base: 'rounded-lg ... focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-900'
```

Después:

```ts
primary:  'bg-accent-primary text-accent-foreground hover:opacity-90',
secondary:'bg-bg-surface-secondary text-text-default hover:bg-bg-surface-secondary/80',
outline:  'bg-transparent border border-hairline text-text-muted hover:text-text-default hover:border-text-muted/40',
ghost:    'bg-transparent text-text-muted hover:text-text-default hover:bg-bg-surface-secondary',
danger:   'bg-transparent border border-hairline text-text-muted hover:text-status-danger hover:border-status-danger/40',
warning:  'bg-transparent border border-hairline text-text-muted hover:text-status-warning hover:border-status-warning/40',
success:  'bg-transparent border border-hairline text-text-muted hover:text-status-success hover:border-status-success/40',
// sizes: sm 'px-3 py-1.5 text-xs' | md 'px-3 py-2 text-xs' | lg 'px-4 py-2.5 text-sm'
// base: 'rounded-md ... transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-accent-primary disabled:opacity-40'
```

Reglas: `rounded-lg`→`rounded-md`, sin `border-2`, sin `shadow-*`/glow, sin `ring-offset-*`, foco con `focus:ring-1 focus:ring-accent-primary`, textos `text-xs` (12px).

### 7.2 `Badge.tsx` — mapa de variantes

Antes:

```ts
default: 'bg-slate-700/40 text-slate-300 border border-slate-600/50',
success: 'bg-neon-green/15 text-neon-green border border-neon-green/30',
warning: 'bg-neon-yellow/15 text-neon-yellow border border-neon-yellow/30',
danger:  'bg-neon-red/15 text-neon-red border border-neon-red/30',
info:    'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30',
// sizes: sm 'px-2 py-0.5 text-xs' | md 'px-2.5 py-1 text-sm' ; base 'rounded-full'
```

Después (sin borde, radio 4px, mono 9–10px):

```ts
default: 'bg-slate-500/15 text-text-subtle',
success: 'bg-status-success/15 text-status-success',
warning: 'bg-status-warning/15 text-status-warning',
danger:  'bg-status-danger/15 text-status-danger',
info:    'bg-accent-primary/15 text-accent-primary',
// sizes: sm 'px-[6px] py-[2px] font-mono text-[9px]' | md 'px-[6px] py-[2px] font-mono text-[10px]'
// base: 'inline-flex items-center rounded transition-colors duration-150'
```

Reglas: `rounded-full`→`rounded` (4px), sin borde, tipografía JetBrains Mono, color solo semántico.

### 7.3 `StatusBadge.tsx` + `StatusDot` — ESTILOS

Antes (mapa por estado con borde y neon):

```ts
Completada:  { dot: 'bg-neon-green shadow-neon-green', badge: 'bg-neon-green/15 text-neon-green border border-neon-green/30' },
'En Proceso':{ dot: 'bg-neon-yellow',                    badge: 'bg-neon-yellow/15 text-neon-yellow border border-neon-yellow/30' },
Pendiente:   { dot: 'bg-neon-red',                       badge: 'bg-neon-red/15 text-neon-red border border-neon-red/30' },
fallback:    { dot: 'bg-slate-400',                      badge: 'bg-slate-700/40 text-slate-300 border border-slate-600/50' },
```

Después:

```ts
Completada:  { dot: 'bg-status-success',                badge: 'badge badge-success' },
'En Proceso':{ dot: 'bg-status-warning',                badge: 'badge badge-warning' },
Pendiente:   { dot: 'bg-status-danger',                 badge: 'badge badge-danger' },
fallback:    { dot: 'bg-slate-400',                     badge: 'badge badge-gray' },
```

Los `dot` mantienen `rounded-full` (dot indicator permitido) pero **sin** `shadow-*`. La base del badge pasa de `rounded-full` a `rounded` y se elimina el borde.

### 7.4 `Input.tsx` — `baseInputClass`

Antes:

```ts
'w-full px-3 py-2 bg-base-800/80 border rounded-lg shadow-inner text-slate-100 placeholder:text-slate-500 transition-colors',
'focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan/60',
'disabled:bg-base-700 disabled:text-slate-500 disabled:cursor-not-allowed',
error ? 'border-neon-red/70 text-neon-red placeholder-neon-red/50' : 'border-base-500',
```

Después:

```ts
'w-full px-3 py-2 text-sm rounded-md bg-bg-surface-secondary border border-hairline text-text-default placeholder:text-text-muted/50 transition-colors duration-150',
'focus:outline-none focus:border-accent-primary',
'disabled:bg-bg-surface-secondary disabled:text-text-muted disabled:cursor-not-allowed',
error ? 'border-status-danger/70 focus:border-status-danger' : '',
```

Reglas: `rounded-lg`→`rounded-md`, sin `shadow-inner`, sin `ring-2`, label del `Input` a `.label` (10px mono uppercase).

### 7.5 `Select.tsx` — trigger + dropdown

Antes (trigger): `bg-base-800/80 border-base-500 rounded-lg shadow-inner ... focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan/60`.
Antes (dropdown): `bg-base-800 border-base-500 rounded-lg shadow-lg shadow-black/50 scrollbar-thin`, opción activa `bg-base-700 text-neon-cyan`, opción normal `text-slate-100 hover:bg-base-700`.

Después (trigger): `.select` (sección 5.3) o equivalente: `bg-bg-surface-secondary border-hairline rounded-md ... focus:border-accent-primary`.
Después (dropdown): `bg-bg-surface border-hairline rounded-md`, opción activa `bg-accent-primary/10 text-accent-primary`, normal `text-text-default hover:bg-bg-surface-secondary`, sin sombra, `scrollbar-none`.

### 7.6 `Card.tsx`

- Clase base `card` (sección 5.3): `bg-bg-surface border border-hairline rounded-card`, sin `backdrop-blur-sm` ni `shadow-neon-soft`.
- Header: `px-4 py-3 border-b border-hairline`, título con `.label` (si es metadata) o `text-sm font-semibold` para encabezado de sección.
- Body: `p-4` (16px).
- Hover (card clickeable): `hover:bg-bg-surface-secondary` + mismo borde (sin `hover:shadow-neon-cyan`).
- Activo/seleccionado: `bg-accent-primary/10 border-accent-primary/40`.

### 7.7 `Modal.tsx`

Antes: panel `card rounded-xl shadow-neon-cyan`, header `p-4 border-b border-base-600`, backdrop `bg-base-900/80 backdrop-blur-sm`, sizes `sm:max-w-md, md:max-w-lg, lg:max-w-2xl, xl:max-w-4xl`.

Después:

- Panel: `card` (sin `shadow-neon-cyan`), `rounded-card` (12px).
- Backdrop: `bg-black/60 backdrop-blur-sm` (blur 4px).
- Header: `px-6 py-4 border-b border-hairline`, título `text-sm font-semibold` (encabezado de sección).
- Tamaños: `sm:max-w-md` (448px), `md:max-w-lg` (512px), `lg:max-w-2xl`, `xl:max-w-4xl` — todos sin sombra.
- Botón de cierre: `text-text-muted hover:text-text-default`.

> Los modales "crudos" que replican `card rounded-xl max-w-md w-full p-6` (en `MateriaProgresoRow.tsx`, `EditarProgresoModal.tsx`, `CompletarMateriaModal.tsx`) deben migrarse a `card rounded-card p-6` y backdrop `bg-black/60 backdrop-blur-sm`.

### 7.8 `ProgressBar.tsx`

Antes: track `h-2 bg-base-600 rounded-full overflow-hidden`, fill con `bg-neon-* shadow-neon-*`, `transition-all duration-300`, colores `blue/green/yellow/red/purple/orange`.

Después:

| Color actual | Uso actual | Nuevo |
|---|---|---|
| `blue` | `CarrerasResumenList` (inactiva) | `primary` → `bg-accent-primary` |
| `green` | `CarrerasResumenList` (activa) | `success` → `bg-status-success` |
| `purple` | `CreditosCard` | `primary` → `bg-accent-primary` |
| `orange` | `ProgresoBarCard` | `primary` → `bg-accent-primary` |
| `yellow` / `red` | (sin uso actual) | `warning` / `danger` |

Nuevo `colors` map:

```ts
const colors = {
    primary: 'bg-accent-primary',
    cyan: 'bg-gradient-to-r from-accent-primary to-accent-cyan',
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    danger: 'bg-status-danger',
};
```

> **Tipo del prop `color` y call sites:** el union type pasa de `'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange'` a `'primary' | 'cyan' | 'success' | 'warning' | 'danger'`. Renombrar los call sites existentes: `StatCards.tsx` `color="purple"` → `color="primary"` (Créditos) y `color="orange"` → `color="primary"` (Progreso General); `progreso/CarrerasResumenList.tsx` `activa ? 'green' : 'blue'` → `activa ? 'success' : 'primary'`. `cyan` (gradiente) queda reservado para el progreso de carrera del dashboard.

- Track: `h-1.5` (6px) estándar o `h-1` (4px) compacto, `bg-bg-surface-secondary rounded-full overflow-hidden`.
- Fill: `transition-[width] duration-500 ease-in-out`.
- `showLabel`: `.label` + `text-text-muted`, alineado right.

### 7.9 `MainLayout.tsx`

- Sidebar: de `w-64` (256px) actual a `w-56` (224px) fijo en desktop (colapsado `w-20`), `bg-bg-sidebar border-r border-hairline-subtle` — fondo **sólido**, sin `bg-base-900/90 backdrop-blur-md`. Igual para el sidebar móvil y la barra superior móvil.
- Nav item activo (antes `bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan`): `text-accent-primary bg-accent-primary/15` sin sombra.
- Nav item inactivo: `text-text-muted hover:text-text-default hover:bg-bg-surface-secondary`.
- Nav item: `rounded-md px-3 py-2.5 text-xs font-medium` (11–12px), `transition-colors duration-150`.
- Logo: texto normal (sin `neon-text`, sin gradiente). Título de marca en `text-sm font-semibold`.
- Avatar (antes `bg-neon-violet/15 text-neon-violet shadow-neon-violet`): `bg-accent-primary/15 text-accent-primary`, sin sombra.
- Botón logout: clase `btn-danger` (no borde grueso neon ni glow).

### 7.10 `Charts.tsx`

> **Estado final (con Recharts):** el dashboard usa `recharts@^3.10.1` (`MateriasPorEstadoChart` como
> `PieChart` donut, `NotasDistribucionChart` y `ProgresoPorAnioChart` como `BarChart`). Aplicado lo de abajo.

- Pastel `MateriasPorEstadoChart`: `Completada` `#10b981`, `En Proceso` `#f59e0b`, `Pendiente` `#ef4444`. Sin `shadow-neon-*`.
- `ProgresoPorAnioChart`: mismos colores de estado que el pastel (pendientes `#ef4444`).
- `NotasDistribucionChart`: color por rango de nota (`COLORES_NOTA`: 4-5 `#64748b`, 6 `#8b5cf6`, 7 `#3b82f6`, 8 `#22d3ee`, 9 `#34d399`, 10 `#10b981`).
- Footer de `NotasDistribucionChart` con promedio y materias con nota en `text-accent-cyan`.
- Labels de valores y estados: `.label` (10px mono uppercase), `text-text-muted`.
- Dots de leyenda: `rounded-full` (permitido — dot indicator) sin sombra.
- Radios de barras: `radius={[4,4,0,0]}` (notas) y `radius={[3,3,0,0]}` (progreso por año) — nunca `rounded-full`.
- Ejes/grid de recharts: grid `rgba(148,163,184,0.09)`, eje `#64748b` 10px JetBrains Mono, `axisLine={false} tickLine={false}`.
- `isAnimationActive` forzado a `true` (recharts deshabilita con `prefers-reduced-motion` por defecto), `animationBegin={0}`, pastel 1200ms / barras 900ms `ease-out`, envoltorio `animate-fade-in`.
- Cards de gráficos con `hover:bg-bg-surface-secondary transition-colors`.
- Hover oscuro en barras/pastel: `activeBar={BAR_ACTIVE_STYLE}` (`stroke: #0a0c12, strokeWidth: 2`) y `activeShape` `ActivePieSlice` (expande `outerRadius + 3`).

### 7.11 `StatCards.tsx`

> **Estado final:** existe un componente interno `StatCard` genérico
> `{ label, value, subtext?, accentClassName, iconName }` usado por `MateriasAprobadasCard`,
> `PromedioCard` y `MateriasDisponiblesCard`. `CreditosCard` y `ProgresoBarCard` usan estructura propia
> (incluyen `ProgressBar`). `TiempoRestanteCard` fue eliminada. `subtext` es **opcional**:
> `MateriasAprobadasCard` y `PromedioCard` no muestran subtexto.

Antes (icon chips con neon y glow):

```ts
'bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan'   // Promedio
'bg-neon-green/15 text-neon-green shadow-neon-green' // Tiempo
'bg-neon-violet/15 text-neon-violet shadow-neon-violet' // Créditos
'bg-neon-orange/15 text-neon-orange shadow-neon-orange' // Progreso
```

Después (sin sombra, color semántico):

```ts
'bg-accent-primary/10 text-accent-primary'  // Promedio (interacción/info)
'bg-status-success/15 text-status-success'  // Materias Aprobadas (positivo)
'bg-accent-primary/10 text-accent-primary'  // Créditos
'bg-accent-cyan/15 text-accent-cyan'        // Materias Disponibles (info/cyan)
'bg-accent-primary/10 text-accent-primary'  // Progreso General
```

- Títulos (`text-sm font-medium text-slate-400`) → `.label`.
- Números grandes (`text-2xl font-bold text-white`): mantener jerarquía, usar `text-text-default` y `font-mono` para los valores numéricos.
- Captions (`text-xs text-slate-400 mt-1`) → `.label`.
- `ProgressBar` con colores según 7.8: `CreditosCard` usa `color="primary"`, `ProgresoBarCard` usa `color="cyan"` (gradiente `accent-primary → accent-cyan`).
- `ProgresoBarCard`: `materiasRestantes` opcional; si se pasa, se muestra como `label mt-2` **debajo** de la barra (`"materias restantes: N"`). En `DashboardPage` se calcula `totalMaterias − materiasCompletadas`.

### 7.12 `constants.ts` — `ESTADOS_MATERIA`

Antes:

```ts
{ id: 1, nombre: 'Pendiente',   color: 'bg-red-100 text-red-700',   emoji: '🔴' },
{ id: 2, nombre: 'En Proceso',  color: 'bg-yellow-100 text-yellow-700', emoji: '🟡' },
{ id: 3, nombre: 'Completada',  color: 'bg-green-100 text-green-700',   emoji: '🟢' },
```

Después (tokens de la app, sin emoji):

```ts
{ id: 1, nombre: 'Pendiente',   color: 'text-status-danger',  badge: 'badge-danger' },
{ id: 2, nombre: 'En Proceso',  color: 'text-status-warning', badge: 'badge-warning' },
{ id: 3, nombre: 'Completada',  color: 'text-status-success', badge: 'badge-success' },
```

> Si `ESTADOS_MATERIA` solo se usa en el módulo admin, verificar su uso real antes de cambiar la forma del objeto.

### 7.13 Páginas y componentes con chips inline

Reemplazos puntuales (ver 6.3 para ubicaciones exactas):

| Patrón actual | Nuevo |
|---|---|
| `px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30` (contadores de carrera/materias) | `badge badge-info` (`bg-accent-primary/15 text-accent-primary rounded px-[6px] py-[2px] font-mono text-[9px]`) |
| `chipClass`/`dotClass` en `MateriaProgresoRow.tsx` y badges de `progreso/index.tsx` | `badge badge-success/warning/danger` + dots `bg-status-*` |
| Nota / tipo / código en `MateriaProgresoRow.tsx` (texto plano) | `nota-chip nota-baja/media/alta`, `tipo-chip-final/promo`, `codigo-chip` (definidos en `index.css`) |
| `Extras.tsx` (colores de extra por materia) | `bg-accent-primary/15 text-accent-primary` y `status-*` según semántica; sin `border-neon-*/30` |
| `MateriaPlanificadaChip.tsx` (`bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30 cursor-grab`) | `bg-accent-primary/15 text-accent-primary border-hairline` |
| `ErrorBoundary.tsx` (`bg-neon-red/15 text-neon-red shadow-neon-soft`, `btn-primary`) | `bg-status-danger/15 text-status-danger`, `btn-primary` |
| `CarreraSelector.tsx` (`card rounded-xl shadow-neon-cyan`) | `card rounded-card` sin sombra |
| Icon chips de `MainLayout` avatar y `StatCards` | ver 7.9 y 7.11 |
| `hover:bg-white/5`, `hover:bg-white/10` | `hover:bg-bg-surface-secondary` |
| `hover:text-neon-cyan` | `hover:text-accent-primary` |
| `text-neon-red` (errores inline) | `text-status-danger` |
| Backdrops `bg-base-900/80 backdrop-blur-sm` | `bg-black/60 backdrop-blur-sm` |
| `hover:shadow-neon-cyan`, `shadow-neon-cyan/20 shadow-sm` (cards seleccionadas) | `bg-accent-primary/10 border-accent-primary/40` |
| Botones inline `border-2 border-neon-*/60 ... hover:shadow-[...]` (raw, fuera de `Button.tsx`) | `btn-primary` / `btn-danger` |
| `text-neon-cyan` en svg/links/iconos | `text-accent-primary` |
| `rounded-2xl` (contenedores de icono en `EmptyState`/`ErrorBoundary`) | `rounded-xl` |
| `border-l-4 border-neon-cyan` (encabezados de sección en `CarreraEditPage`/`MateriaEditPage`) | `border-l-2 border-accent-primary` |
| Tab activo `border-neon-cyan text-neon-cyan` (`AdminTabs`/`CarreraEditTabs`) | `border-accent-primary text-accent-primary` |
| Página activa de paginador `bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50` | `bg-accent-primary/15 text-accent-primary border-accent-primary/30` |
| Dots de estado/activo `bg-neon-cyan` (`PlanificacionCard`, `CarreraSelector`) | `bg-accent-primary` |

### 7.14 Tablas

- Sin bordes de tabla: solo `border-b border-hairline` en filas.
- Header: `.label` (`text-[10px] font-mono uppercase tracking-widest text-text-muted`).
- Celdas: `text-xs font-normal text-text-default`.
- Row hover: `hover:bg-bg-surface-secondary`.
- Sin zebra striping.

### 7.15 Modales

- Backdrop: `bg-black/60 backdrop-blur-sm` (blur 4px).
- Panel: `bg-bg-surface border border-hairline rounded-card p-6` (24px), `max-w-md` (448px) o `max-w-lg` (512px) para formularios.
- Sin animación obligatoria; si se agrega, opacity 200ms.

---

## 8. Mapa de migración de utilidades

| Actual (neon) | Nuevo (Suizo) | Notas |
|---|---|---|
| `bg-base-900` | `bg-bg-page` | fondo de página |
| `bg-base-800` / `bg-base-800/70` | `bg-bg-surface` | cards |
| `bg-base-700` / `bg-base-600` | `bg-bg-surface-secondary` | inputs, hovers, tracks |
| `text-white` / `text-slate-100` | `text-text-default` | texto principal |
| `text-slate-400` / `text-slate-500` | `text-text-muted` | labels, captions |
| `text-slate-300` | `text-text-subtle` | info secundaria |
| `text-neon-cyan` | `text-accent-primary` | interactivo/links/iconos; `text-accent-cyan` solo para highlight de estadísticas (p.ej. barras de promedio) |
| `bg-neon-cyan` | `bg-accent-primary` | interactivo (indigo) |
| `bg-neon-blue` | `bg-accent-primary` | azul → indigo |
| `bg-neon-violet` / `bg-neon-pink` | — | sin equivalente (no decorar) |
| `bg-neon-orange` | `bg-status-warning` | naranja → amber (el `ProgressBar` `orange` va a `primary`, ver 7.8) |
| `border-base-600` / `border-base-500` | `border-hairline` | |
| `text-neon-green` + `bg-neon-green/15` | `badge-success` | |
| `text-neon-yellow` + `bg-neon-yellow/15` | `badge-warning` | |
| `text-neon-red` + `bg-neon-red/15` | `badge-danger` | |
| `bg-neon-cyan/15 text-neon-cyan` (badge info) | `badge-info` (indigo) | |
| `bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30` (contadores) | `badge-info` sin borde | chips de conteo |
| `bg-neon-green/yellow/red/15 ... border border-neon-*/30` (chips de estado) | `badge-success/warning/danger` | sin borde, radio 4px |
| `bg-neon-violet/15 text-neon-violet` / `bg-neon-orange/15 text-neon-orange` | `bg-accent-primary/10 text-accent-primary` | icon chips sin decorar |
| `bg-slate-700/40 text-slate-300 border-slate-600/50` | `badge-gray` | fallback neutral |
| `bg-red-100 text-red-700` / `bg-yellow-100 text-yellow-700` / `bg-green-100 text-green-700` | `text-status-danger/warning/success` | `ESTADOS_MATERIA` |
| `hover:bg-white/5`, `hover:bg-white/10` | `hover:bg-bg-surface-secondary` | hovers |
| `hover:text-neon-cyan` | `hover:text-accent-primary` | enlaces/hover |
| `bg-base-900/80` (backdrop) | `bg-black/60` | overlays |
| `rounded-full` (botones, badges) | `rounded-md` / `rounded` | badge 4px, control 6px |
| `shadow-neon-*` / `shadow-neon-soft` | (eliminar) | sin sombras |
| `neon-text` (`bg-clip-text`) | texto plano | sin gradientes |
| `hover:shadow-[...]` | `hover:border-status-danger/40` etc. | borde para hover |
| `focus:ring-2 focus:ring-neon-cyan focus:ring-offset-*` | `focus:ring-1 focus:ring-accent-primary` | sin offset, sin sombra |
| `btn-primary` (outline cyan) | `btn-primary` (solid indigo) | |
| `btn-danger` (outline red grueso) | `btn-danger` (ghost + hover red) | |
| `rounded-lg` (cards) | `rounded-card` (12px) | |
| `shadow-inner` (inputs) | (eliminar) | borde + fondo |

---

## 9. Checklist de migración por archivo

Orden sugerido:

1. [ ] `tailwind.config.ts` → tokens Suizo (sección 4) y `index.css` → nuevo CSS (sección 5). Borrar el código de la sección 6.
2. [ ] Migrar primero los componentes `ui/*` (sección 7): `Button`, `Badge`, `StatusBadge`, `Input`, `Select`, `Modal`, `Card`, `ProgressBar`.
3. [ ] Migrar `constants.ts` (`ESTADOS_MATERIA`), `MainLayout`, `Charts`, `StatCards`.
4. [ ] Migrar páginas y componentes con chips inline (sección 7.13).

Para cada archivo `.tsx` bajo `frontend/src`:

5. [ ] Reemplazar `bg-base-*` por `bg-bg-*` según la sección 8.
6. [ ] Reemplazar `text-neon-*` por su semántica (indigo/cyan/status).
7. [ ] Eliminar toda clase `shadow-*`, `hover:shadow-*`, `focus:ring-offset-*`, `border-2 border-neon-*`.
8. [ ] Eliminar `neon-text` y cualquier `bg-gradient-to-r` en fondos (conservar solo `progress-fill-gradient` y barras de carrera).
9. [ ] `rounded-full` → `rounded-md` (controles), `rounded` (badges), `rounded-card` (paneles); conservar solo en progress, dots y el spinner.
10. [ ] Todo título de sección / fila de metadata / caption → `.label`.
11. [ ] Botones: componentes `Button` con variantes nuevas; clases `.btn-primary`/`.btn-ghost`/`.btn-danger` donde se usan raw.
12. [ ] Badges a `badge-success/warning/danger/gray/info/locked`.
13. [ ] Inputs/selects a `.input` / `.select` (sin `shadow-inner`).
14. [ ] Modales: `max-w-md`/`max-w-lg`, `p-6`, backdrop `bg-black/60 backdrop-blur-sm`.
15. [ ] Verificar hover de cards: `hover:bg-bg-surface-secondary` (nunca cambiar borde por shadow).
16. [ ] **Verificación final de neon:** grep sobre `frontend/src` sin resultados para `neon`, `shadow`, `glow`, `bg-clip-text`, `border-2 border-neon-*` y `backdrop-blur` (salvo el overlay de modales). Nota: `border-2` plano (`border-dashed`, spinner) y `rounded-full` del spinner se conservan.
17. [ ] `npm run lint` (oxlint) y `npm run build` sin errores.

---

## 10. Reglas globales del nuevo estilo

- **Dark mode only** — sin toggle de light mode.
- **Cero efectos neon** — se eliminan todas las sombras glow, gradientes decorativos, `neon-text`, animaciones de brillo y tokens `neon.*`; el color queda reservado a estado y significado.
- **Sin gradientes decorativos** en fondos, headers o heroes.
- **Sin `box-shadow` en ningún lugar** — elevación solo con borde + diferencia de fondo.
- **Sin `rounded-full`** salvo en progress bars, indicadores de punto (dots) y el spinner de carga.
- **Color solo comunica significado** (estado, categoría, interacción) — nunca decoración.
- **Label 10px mono uppercase** = firma tipográfica: aplicarlo consistentemente a todo título de sección, fila de metadata y caption de estadística.
- **Scrollbars ocultas por defecto** (`scrollbar-none`), solo visibles si el SO lo requiere.
- **Transiciones:** `transition-all duration-150` en elementos interactivos; `transition-[width] duration-500` en progress bars; modales con opacity 200ms (opcional).
- **Placeholders realistas** — sin lorem ipsum.

---

## 11. Resultado esperado

- App con estética Suiza: superficie neutra oscura, jerarquía clara por tipografía y espaciado, color reservado a estados.
- Dashboard, plan de estudios, progreso, planificador, trayectorias y admin visualmente consistentes entre sí.
- Cero sombras, cero gradientes decorativos, cero `rounded-full` fuera de contexto.
- Accesibilidad: texto principal `#e2e8f0` sobre `#0a0c12` ≈ 16:1; los acentos `status-*` cumplen ≥ 4.5:1 sobre `#111520`. Nota: el indigo `accent-primary` (#6366f1) rinde ≈ 4.2:1 y `text-muted` (#64748b) ≈ 3.9:1 — usarlos solo en elementos interactivos grandes y texto secundario no crítico, nunca en texto de 10px.
