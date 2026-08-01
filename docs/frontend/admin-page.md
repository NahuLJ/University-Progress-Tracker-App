# Página Administración (Admin) — Especificación Técnica (implementada)

> **Estado de implementación:** ✅ Completa. Módulo para gestión del catálogo académico
> accedido vía nav `Admin` (ruta `/admin`, privada). `AdminPage` orquesta 2 tabs (Carreras /
> Materias) con `CrearCarreraModal`, `CrearMateriaModal`. Las tablas (`TablaCarreras`,
> `TablaMaterias`) persisten tab activo, página y límite en `localStorage`.
> Cada fila se renderiza como **card independiente** (no `<table>`) con chips neon-cyan para
> códigos, pills `rounded-full` para metadatos y botones de acción con `hover:bg`.
> El código de materia usa `<Badge variant="info">` (chip neon-cyan).
> El nombre de la fila **no es clickeable**; la navegación al detalle es solo por botón "Ver".
> Usa `useAdminCarreras`/`useAdminMaterias` (React Query) sobre los servicios
> `carrerasService`/`materiasAdminService`. Verificado end-to-end contra el backend.
> ⚠️ El backend aún no aplica `RolesGuard`: cualquier usuario autenticado puede entrar
> (pendiente de seguridad).

## Estructura de Componentes (real)

```
pages/
└── AdminPage.tsx               # orquesta tabs + modales de creación; persiste tab activo en localStorage

components/admin/
├── AdminTabs.tsx               # tabs: Carreras | Materias
├── TablaCarreras.tsx           # tabla paginada; persiste page + limit en localStorage
├── TablaMaterias.tsx           # tabla paginada; persiste page + limit en localStorage
├── CrearCarreraModal.tsx       # formulario CrearCarreraDto (RHF + Zod)
├── CrearMateriaModal.tsx       # formulario CrearMateriaDto (RHF + Zod)
├── PlanEstudiosEditor.tsx      # gestión de plan de estudios: lista con chip de código,
│                                 # modal para agregar materia, modal de confirmación para quitar
├── CorrelativasEditor.tsx      # gestión de correlativas: selector de materia con chip,
│                                 # modal para asignar correlativa, modal de confirmación para eliminar
├── CarreraEditTabs.tsx         # tabs: Datos generales | Plan de estudios | Correlativas
└── FiltrosModal.tsx            # filtros y ordenamiento (usa Select personalizado)

components/ui/
├── Card.tsx · Modal.tsx · Select.tsx · Input.tsx · Button.tsx · Alert.tsx · Badge.tsx

hooks/
├── useLocalStorage.ts           # hook genérico para persistir estado en localStorage
├── useAdminCarreras.ts          # crearCarrera + agregarMateriaAlPlan (mutations)
└── useAdminMaterias.ts         # listar/crear materias + asignar/quitar correlativas

services/carreras.service.ts    # carrerasService.* (admin) + materiasAdminService.*
types/
├── carrera.types.ts            # CrearCarreraDto, AgregarMateriaPlanDto, PlanEstudios, MateriaPlanEstudios
└── materia.types.ts            # CrearMateriaDto, AsignarCorrelativaDto, MateriaDetalle
```

### Árbol de Composición

```
MainLayout
└── AdminPage
    ├── Header "Administración académica" + descripción
    ├── AdminTabs (Carreras | Materias) — tab activo persistido en localStorage
    ├── [Tab Carreras]      Card + botón "Nueva carrera" → CrearCarreraModal
    │                        └── TablaCarreras (page + limit persistidos en localStorage)
    ├── [Tab Materias]      Card + botón "Nueva materia" → CrearMateriaModal
    │                        └── TablaMaterias (page + limit persistidos en localStorage)
    ├── CrearCarreraModal · CrearMateriaModal
```

> **Persistencia:** `AdminPage` lee/escribe el tab activo en `localStorage` bajo clave
> `admin-tab`. `TablaCarreras` persiste `page` (`admin-carreras-page`) y `limit`
> (`admin-carreras-limit`). `TablaMaterias` persiste `page` (`admin-materias-page`) y
> `limit` (`admin-materias-limit`). Al volver de una página de detalle, la última página
> y el tamaño de página se restauran automáticamente.
> El debounce de búsqueda usa `search === debouncedSearch` (en lugar del patrón `isFirstRender`)
> para evitar reseteo de página al montar el componente en `<StrictMode>`.

---

## Endpoints consumidos

| Método | Ruta | Origen |
|---|---|---|
| `POST` | `/api/carreras` | `carrerasService.crearCarrera` |
| `POST` | `/api/materias` | `materiasAdminService.crearMateria` |
| `GET` | `/api/materias` | `materiasAdminService.listarMaterias` |
| `GET` | `/api/materias/:id` | `materiasAdminService.obtenerMateria` |
| `POST` | `/api/carreras/:id/materias` | `carrerasService.agregarMateriaAlPlan` |
| `POST` | `/api/materias/:id/correlativas` | `materiasAdminService.asignarCorrelativa` |
| `DELETE` | `/api/materias/:id/correlativas/:correlativaId` | `materiasAdminService.eliminarCorrelativa` |
| `GET` | `/api/carreras/:id/plan-estudios` | `carrerasService.obtenerPlanEstudios` (para el árbol del plan) |

---

## Comportamiento UX/UI

### CrearCarreraModal
RHF + Zod (`nombre` 3–200, `descripcion` opcional ≤500, `duracionAnios` 1–10). Al guardar invoca
`useAdminCarreras().crearCarrera` → invalida `['carreras','disponibles']` (el catálogo de carreras se
refresca en el selector del plan). El campo descripción es un `<textarea>` auto-creciente con
contador de caracteres.

### CrearMateriaModal
RHF + Zod (`nombre`, `codigo` ≤20, `cargaHoraria` ≥1 entero, `creditos` ≥1 entero, `descripcion`
opcional ≤500). Al guardar invoca `useAdminMaterias().crearMateria` → invalida `['materias','catalogo']`.
El campo descripción es un `<textarea>` auto-creciente con contador de caracteres.

### PlanEstudiosEditor (en CarreraEditPage, tab "Plan de estudios")
1. **Lista de materias** en el plan organizada por Año → Cuatrimestre. Cada materia se muestra como
   `{nro} - {nombre}` con `<Badge variant="info">` (chip neon-cyan) para el código. Botón "Quitar"
   abre modal de confirmación con advertencia de irreversibilidad.
2. **Botón "Agregar materia"** abre un `<Modal>` con:
   - `Select` del catálogo de materias disponibles (dropdown personalizado con scroll, max 192px)
   - Campos `Año`, `Cuatrimestre`, `Nro` (input numéricos)
   - Botones Cancelar / Agregar al plan
3. Al agregar exitosamente, se invalidan las queries de plan, progreso y planificación.

### CorrelativasEditor (en CarreraEditPage, tab "Correlativas")
1. **Seleccionar materia** — `Select` del plan. Al seleccionar, muestra las correlativas actuales
   con `<Badge variant="info">` para el código de cada correlativa. Botón "Eliminar" abre modal
   de confirmación.
2. **Botón "Agregar correlativa"** (habilitado solo con materia seleccionada) abre un `<Modal>` con:
   - `Select` de materias posibles (excluye la materia actual y las ya asignadas)
   - Botones Cancelar / Asignar correlativa
3. Al asignar/eliminar exitosamente, se invalidan las queries relevantes.

### Select personalizado (reemplaza `<select>` nativo)
El componente `Select` (`components/ui/Select.tsx`) reemplaza el `<select>` nativo por un dropdown
personalizado con:
- Trigger button estilizado con tema oscuro (bg-base-800, border-base-500, focus ring neon-cyan)
- Lista de opciones con `max-h-48 overflow-y-auto scrollbar-thin` (altura máxima fija de ~192px)
- Opciones resaltadas al hover (bg-base-700) y seleccionadas (bg-base-700 + text-neon-cyan)
- Flecha caret SVG personalizada
- Compatible con `label`, `error`, `placeholder`, `disabled`, `maxLength`

### Input con textarea auto-creciente
El componente `Input` (`components/ui/Input.tsx`) soporta un prop `textarea` que renderiza un
`<textarea>` en lugar de `<input>`:
- Auto-crecimiento vertical: ajusta `height` al `scrollHeight` en cada `onInput`
- `maxLength` opcional: muestra contador "Límite: X caracteres" debajo del campo
- Cuando `textarea` no está activo, se comporta como `<input>` estándar

### Validaciones del Lado del Cliente (Zod)

| DTO | Reglas |
|---|---|
| `CrearCarreraDto` | nombre 3–200, duracionAnios 1–10 (coerce a number) |
| `CrearMateriaDto` | nombre ≤200, codigo ≤20, cargaHoraria ≥1 (int), creditos ≥1 (int) |
| `AgregarMateriaPlanDto` | materiaId, anio ≥1, cuatrimestre ≥1, orden ≥1 |
| `AsignarCorrelativaDto` | materiaCorrelativaId entero, distinto de la materia origen |

---

## Estados de la Página

| Estado | Comportamiento |
|---|---|
| Cargando catálogo | `LoadingSpinner` en la sección correspondiente |
| Error de carga | `QueryError` con botón "Reintentar" (invalida la query) |
| Error de mutación | `Alert` rojo sobre el formulario/panel |
| Carrera sin materias en plan | Mensaje "Esta carrera aún no tiene materias en su plan" |
| Materia sin correlativas | Mensaje "Esta materia no tiene correlativas" |

---

## Pendiente (seguridad)

- Backend: agregar `@Roles('admin')` + `RolesGuard` en los endpoints de escritura.
- Frontend: ocultar el nav `Admin` cuando el usuario no sea admin.
