# Página Administración (Admin) — Especificación Técnica (implementada)

> **Estado de implementación:** ✅ Completa. Módulo para gestión del catálogo académico accedido vía nav
> `Admin` (ruta `/admin`, privada). `AdminPage` orquesta 4 tabs (Carreras / Materias / Plan de estudios /
> Correlativas) con `CrearCarreraModal`, `CrearMateriaModal`, `PlanEstudiosAdmin` y
> `MateriaCorrelativasAdmin`. Usa `useAdminCarreras`/`useAdminMaterias` (React Query) sobre los servicios
> `carrerasService`/`materiasAdminService`. Verificado end-to-end contra el backend. ⚠️ El backend aún no
> aplica `RolesGuard`: cualquier usuario autenticado puede entrar (pendiente de seguridad).

## Estructura de Componentes (real)

```
pages/
└── AdminPage.tsx               # orquesta tabs + modales de creación

components/admin/
├── AdminTabs.tsx               # tabs: Carreras | Materias | Plan de estudios | Correlativas
├── CrearCarreraModal.tsx       # formulario CrearCarreraDto (RHF + Zod)
├── CrearMateriaModal.tsx       # formulario CrearMateriaDto (RHF + Zod)
├── PlanEstudiosAdmin.tsx       # seleccionar carrera → ver plan (árbol) → agregar materia
└── MateriaCorrelativasAdmin.tsx# selector de carrera + materia → ver/asignar/quitar correlativas (por carrera o global)

components/ui/
├── Card.tsx · Modal.tsx · Select.tsx · Input.tsx · Button.tsx · Alert.tsx · Badge.tsx

hooks/
├── useAdminCarreras.ts         # crearCarrera + agregarMateriaAlPlan (mutations)
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
    ├── AdminTabs (Carreras | Materias | Plan de estudios | Correlativas)
    ├── [Tab Carreras]      Card + botón "Nueva carrera" → CrearCarreraModal
    ├── [Tab Materias]      Card + botón "Nueva materia" → CrearMateriaModal
    ├── [Tab Plan]          PlanEstudiosAdmin
    │                        ├── Select de carrera
    │                        ├── Card "Materias en el plan" (árbol Año→Cuatrimestre, con # corr.)
    │                        └── Card "Agregar materia al plan" (Select materia + año/cuatrimestre/orden)
    ├── [Tab Correlativas]  MateriaCorrelativasAdmin
    │                        ├── Card "Seleccionar carrera" (Select carrera, opcional, para filtrar correlativas)
    │                        ├── Card "Seleccionar materia" (lista + correlativas actuales filtradas por carrera + quitar)
    │                        └── Card "Agregar correlativa" (Select materia + botón asignar, opcionalmente por carrera)
    └── CrearCarreraModal · CrearMateriaModal
```

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
RHF + Zod (`nombre` 3–200, `descripcion` opcional, `duracionAnios` 1–10). Al guardar invoca
`useAdminCarreras().crearCarrera` → invalida `['carreras','disponibles']` (el catálogo de carreras se
refresca en el selector del plan).

### CrearMateriaModal
RHF + Zod (`nombre`, `codigo` ≤20, `cargaHoraria` ≥1 entero, `creditos` ≥1 entero, `descripcion`
opcional). Al guardar invoca `useAdminMaterias().crearMateria` → invalida `['materias','catalogo']`.

### PlanEstudiosAdmin
1. `Select` de carrera (datos reales de `obtenerCarrerasDisponibles`).
2. `Card` izquierda: árbol Año→Cuatrimestre con las materias del plan (`obtenerPlanEstudios`) y la
   cantidad de correlativas por materia.
3. `Card` derecha: elige una materia del catálogo que **no** esté ya en el plan + `anio`/`cuatrimestre`/
   `orden`, y llama `agregarMateriaAlPlan`. Al éxito, invalida la query del plan.

### MateriaCorrelativasAdmin
1. `Select` de carrera (opcional). Si se selecciona, las correlativas se asignan/filtran por esa carrera.
   Si se deja en "Global", las correlativas aplican a todas las carreras (`carrera_id = NULL`).
2. `Select` de materia del catálogo.
3. Muestra sus correlativas actuales (vía `obtenerMateria` con `carreraId` opcional) con botón "Quitar"
   (`eliminarCorrelativa` con `carreraId` opcional).
4. `Select` de "materia correlativa" (filtra la propia y las ya asignadas) + botón "Asignar correlativa"
   (`asignarCorrelativa` con `carreraId` opcional). Previene auto-referencia y duplicados (el backend también lo rechaza).

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
