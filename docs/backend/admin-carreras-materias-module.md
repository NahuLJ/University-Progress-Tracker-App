# Módulo de Administración: Carreras, Materias y Correlativas — Especificación Técnica

> ✅ **Implementado** — El backend expone todos los endpoints CRUD (ver
> `docs/backend/carreras-materias-module.md`). El frontend tiene servicios, hooks, página
> `/admin` y componentes de UI completos. La sección de UI se accede desde el nav `Admin`.

## Objetivo

Permitir la gestión del catálogo académico desde la app (rol admin):
1. Crear **carreras** (`POST /api/carreras`).
2. Crear **materias** en el catálogo global (`POST /api/materias`).
3. Agregar **materias al plan de estudios** de una carrera (`POST /api/carreras/:id/materias`).
4. Gestionar **correlativas** de una materia (`POST` / `DELETE /api/materias/:id/correlativas/...`).

> Nota: los endpoints de escritura del backend usan `@ApiBearerAuth()` pero aún no aplican
> un guard de roles. Para producción conviene agregar `@Roles('admin')` + `RolesGuard` en el
> backend y ocultar la sección de admin en el frontend cuando el usuario no sea admin.

## Endpoints consumidos (ya existen en el backend)

| Método | Ruta | Body / Params | Respuesta |
|---|---|---|---|
| `POST` | `/api/carreras` | `CrearCarreraDto` | `201` carrera creada |
| `POST` | `/api/materias` | `CrearMateriaDto` | `201` materia creada |
| `POST` | `/api/carreras/:id/materias` | `AgregarMateriaPlanDto` | `201` materia en plan |
| `POST` | `/api/materias/:id/correlativas` | `{ materiaCorrelativaId, carreraId? }` | `201` correlativa asignada |
| `DELETE` | `/api/materias/:id/correlativas/:correlativaId` | `?carreraId=N` | `200` eliminada |
| `GET` | `/api/materias` | — | catálogo global |
| `GET` | `/api/carreras/:id/plan-estudios` | — | plan con correlativas |

## Servicios ya disponibles en el frontend

`frontend/src/services/carreras.service.ts`:
- `carrerasService.crearCarrera(data: CrearCarreraDto)`
- `carrerasService.agregarMateriaAlPlan(carreraId, data: AgregarMateriaPlanDto)`

`frontend/src/services/carreras.service.ts` → `materiasAdminService`:
- `listarMaterias()`
- `crearMateria(data: CrearMateriaDto)`
- `asignarCorrelativa(materiaId, data: AsignarCorrelativaDto)`
- `eliminarCorrelativa(materiaId, correlativaId, carreraId?)`

## Tipos (ya en `frontend/src/types/`)

- `carrera.types.ts`: `CrearCarreraDto`, `AgregarMateriaPlanDto`
- `materia.types.ts`: `Materia`, `CrearMateriaDto`, `AsignarCorrelativaDto`, `Correlativa`

## Estructura de archivos a crear en el frontend

```
frontend/src/
├── pages/
│   └── AdminPage.tsx                 # ruta /admin: tabs Carreras / Materias
│
├── components/admin/
│   ├── CrearCarreraModal.tsx         # formulario CrearCarreraDto (RHF + Zod)
│   ├── CrearMateriaModal.tsx         # formulario CrearMateriaDto (RHF + Zod)
│   ├── PlanEstudiosAdmin.tsx         # árbol por carrera + agregar materia + orden/año/cuatrimestre
│   ├── MateriaCorrelativasAdmin.tsx  # lista materias + asignar/quitar correlativa
│   └── AdminTabs.tsx                 # tabs: Carreras | Materias
│
├── hooks/
│   ├── useAdminCarreras.ts           # useMutation crearCarrera + agregarMateriaAlPlan
│   └── useAdminMaterias.ts           # useQuery listarMaterias + useMutation CRUD correlativas
│
└── routes/index.tsx                  # agregar ruta /admin (lazy) tras PrivateRoute
```

## Comportamiento esperado

### Crear carrera
1. `CrearCarreraModal` con campos `nombre` (3–200), `descripcion` (opcional), `duracionAnios` (1–10, 1 decimal).
2. Al guardar → `carrerasService.crearCarrera` → `invalidateQueries(['carreras'])` y feedback con `Alert`.

### Crear materia (catálogo global)
1. `CrearMateriaModal` con `nombre`, `codigo` (≤20, único), `descripcion`, `cargaHoraria` (>0), `creditos` (>0).
2. Al guardar → `materiasAdminService.crearMateria` → refetch de catálogo.

### Plan de estudios de una carrera
1. Seleccionar carrera → `obtenerPlanEstudios(carreraId)` (ya existe en `carrerasService`).
2. `PlanEstudiosAdmin` permite elegir una materia del catálogo + `anio`/`cuatrimestre`/`orden` y llama `agregarMateriaAlPlan`.

### Correlativas
1. `MateriaCorrelativasAdmin` permite seleccionar una carrera (opcional) y una materia; muestra sus correlativas filtradas por carrera.
2. Asignar: `asignarCorrelativa(materiaId, { materiaCorrelativaId, carreraId? })`. Si se provee `carreraId`, la correlativa aplica solo a esa carrera.
3. Quitar: `eliminarCorrelativa(materiaId, correlativaId, carreraId?)`.

## Validaciones del lado del cliente (Zod)

| DTO | Reglas |
|---|---|
| `CrearCarreraDto` | nombre 3–200, duracionAnios 1–10 (1 decimal) |
| `CrearMateriaDto` | nombre ≤200, codigo ≤20, cargaHoraria ≥1, creditos ≥1 |
| `AgregarMateriaPlanDto` | materiaId entero, anio ≥1, cuatrimestre ≥1, orden ≥1 |
| `AsignarCorrelativaDto` | materiaCorrelativaId entero, distinto de la materia origen |

## Rutas

Agregar en `frontend/src/routes/index.tsx` (junto a las rutas protegidas):

```typescript
{ path: '/admin', element: <SuspenseWrapper><AdminPage /></SuspenseWrapper> }
```

Y registrar `AdminPage` en `frontend/src/routes/lazy-pages.tsx` con `lazy(() => import('../pages/AdminPage'))`.

## Checklist de implementación

- [x] `AdminPage.tsx` + `AdminTabs.tsx`
- [x] `CrearCarreraModal.tsx` + `useAdminCarreras.ts`
- [x] `CrearMateriaModal.tsx` + `useAdminMaterias.ts`
- [x] `PlanEstudiosAdmin.tsx`
- [x] `MateriaCorrelativasAdmin.tsx`
- [x] Ruta `/admin` en `routes/index.tsx` y `lazy-pages.tsx`
- [x] Nav `Admin` en `MainLayout`
- [x] `GET /api/carreras/:id/plan-estudios` devuelve `{ carrera, materias, anios }` con correlativas
- [ ] (Backend, opcional) `@Roles('admin')` + `RolesGuard` en los endpoints de escritura
- [ ] Ocultar acceso a `/admin` si el usuario no es admin
