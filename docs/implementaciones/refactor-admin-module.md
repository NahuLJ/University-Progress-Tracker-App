# Refactor del Módulo Admin — Documento de Implementación

## 1. Resumen del requerimiento

El módulo admin actual tiene 4 pestañas (Carreras, Materias, Plan de estudios, Correlativas) con una UX mínima
(listados simples sin búsqueda, filtros ni ordenamiento). Se requiere refactorizar a **2 pestañas** (Carreras,
Materias) con tabla de datos, buscador, filtros/orden, acciones CRUD, soft-delete y nuevas páginas de
detalle/edición. La gestión del plan de estudios y correlativas se traslada a la página de edición de cada
carrera.

### Cambios principales

| Actual | Nuevo |
|---|---|
| 4 tabs (Carreras, Materias, Plan, Correlativas) | 2 tabs (Carreras, Materias) |
| Listado simple sin búsqueda ni filtros | Tabla con buscador, filtros, ordenamiento y paginación |
| Sin acciones (solo crear) | Acciones: detalle, editar, eliminar (por fila) |
| Sin soft-delete | Soft-delete en `carrera` y `materia` (columna `activo`) |
| Plan de estudios y correlativas como tabs separados | Plan de estudios y correlativas desde la edición de carrera |
| Sin página de detalle de materia | Nueva página `MateriaDetailPage` |
| Sin páginas de edición | Nuevas páginas `CarreraEditPage` y `MateriaEditPage` |

---

## 2. Modelo de datos

### 2.1 Modificaciones en `carrera`

Agregar columna:
```
activo   BOOLEAN  NOT NULL  DEFAULT TRUE
```

Todas las queries existentes deben filtrar `activo = true` por defecto. Los endpoints admin
pueden recibir `?incluirInactivos=true` para ver también los desactivados (recuperación).

### 2.2 Modificaciones en `materia`

Agregar columna:
```
activo   BOOLEAN  NOT NULL  DEFAULT TRUE
```

Misma regla: queries públicas solo devuelven `activo = true`.

### 2.3 Migración SQL

```sql
ALTER TABLE carrera
    ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD INDEX idx_carrera_activo (activo);

ALTER TABLE materia
    ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD INDEX idx_materia_activo (activo);
```

---

## 3. Backend

### 3.1 Modificaciones en entidades

#### `Carrera` entity

```typescript
// Agregar:
@Column({ default: true })
activo: boolean;
```

#### `Materia` entity

```typescript
// Agregar:
@Column({ default: true })
activo: boolean;
```

### 3.2 Nuevos DTOs

| Archivo | Propósito |
|---|---|
| `backend/src/modules/carreras/dto/actualizar-carrera.dto.ts` | Mismos campos que `CrearCarreraDto` pero todos opcionales (PartialType) |
| `backend/src/modules/materias/dto/actualizar-materia.dto.ts` | Mismos campos que `CrearMateriaDto` pero todos opcionales (PartialType) |
| `backend/src/modules/carreras/dto/filtrar-carreras.dto.ts` | Query params: `search`, `sortBy`, `sortOrder`, `incluirInactivos`, `page` (default 1), `limit` (default 20) |
| `backend/src/modules/materias/dto/filtrar-materias.dto.ts` | Query params: `search`, `sortBy`, `sortOrder`, `incluirInactivos`, `page` (default 1), `limit` (default 20) |

### 3.3 Nuevos endpoints y modificaciones

#### CarrerasController

| Método | Ruta | Cambio |
|---|---|---|
| `GET` | `/carreras` | **Modificado:** acepta query params `search`, `sortBy`, `sortOrder`, `incluirInactivos`, `page`, `limit`. Respuesta paginada `{ data, total, page, limit, totalPages }`. Por defecto filtra `activo = true`. |
| `GET` | `/carreras/:id` | **Modificado:** incluye `planEstudios` con datos de plan + correlativas por materia. |
| `PUT` | `/carreras/:id` | **Nuevo:** actualizar datos de la carrera. |
| `DELETE` | `/carreras/:id` | **Nuevo:** soft-delete (set `activo = false`). |
| `PATCH` | `/carreras/:id/restore` | **Nuevo:** restaurar carrera (set `activo = true`). |
| `GET` | `/carreras/:id/plan-estudios` | Sin cambios (ya existe). |
| `POST` | `/carreras/:id/materias` | Sin cambios (ya existe). |
| `DELETE` | `/carreras/:id/materias/:carreraMateriaId` | **Nuevo:** quitar materia del plan de estudios de la carrera. |

#### MateriasController

| Método | Ruta | Cambio |
|---|---|---|
| `GET` | `/materias` | **Modificado:** acepta query params `search`, `sortBy`, `sortOrder`, `incluirInactivos`, `page`, `limit`. Respuesta paginada `{ data, total, page, limit, totalPages }`. Por defecto filtra `activo = true`. |
| `GET` | `/materias/:id` | **Modificado:** además de correlativas, devuelve lista de carreras que contienen esta materia (desde `planEstudios`). |
| `PUT` | `/materias/:id` | **Nuevo:** actualizar datos de la materia. |
| `DELETE` | `/materias/:id` | **Nuevo:** soft-delete (set `activo = false`). |
| `PATCH` | `/materias/:id/restore` | **Nuevo:** restaurar materia (set `activo = true`). |
| `POST` | `/materias/:id/correlativas` | Sin cambios (ya existe). |
| `DELETE` | `/materias/:id/correlativas/:correlativaId` | Sin cambios (ya existe). |

### 3.4 Lógica de filtros y ordenamiento

#### `GET /carreras` modificado

```typescript
async listar(query: FiltrarCarrerasDto): Promise<{
  data: Carrera[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const qb = this.carreraRepo.createQueryBuilder('c');

  // Filtro activo (por defecto solo activas)
  if (!query.incluirInactivos) {
    qb.andWhere('c.activo = :activo', { activo: true });
  }

  // Búsqueda por nombre
  if (query.search) {
    qb.andWhere('c.nombre LIKE :search', { search: `%${query.search}%` });
  }

  // Ordenamiento
  const order = query.sortOrder === 'DESC' ? 'DESC' : 'ASC';
  const sortBy = ['nombre', 'duracionAnios'].includes(query.sortBy)
    ? `c.${query.sortBy}`
    : 'c.nombre';
  qb.orderBy(sortBy, order);

  // Paginación
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const total = await qb.getCount();
  const totalPages = Math.ceil(total / limit);
  const data = await qb.skip((page - 1) * limit).take(limit).getMany();

  return { data, total, page, limit, totalPages };
}
```

#### `GET /materias` modificado

```typescript
async listar(query: FiltrarMateriasDto): Promise<{
  data: Materia[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const qb = this.materiaRepo.createQueryBuilder('m');

  if (!query.incluirInactivos) {
    qb.andWhere('m.activo = :activo', { activo: true });
  }

  if (query.search) {
    qb.andWhere(
      '(m.nombre LIKE :search OR m.codigo LIKE :search)',
      { search: `%${query.search}%` },
    );
  }

  const sortBy = ['nombre', 'codigo', 'cargaHoraria', 'creditos'].includes(query.sortBy)
    ? `m.${query.sortBy}`
    : 'm.nombre';
  const order = query.sortOrder === 'DESC' ? 'DESC' : 'ASC';
  qb.orderBy(sortBy, order);

  // Paginación
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const total = await qb.getCount();
  const totalPages = Math.ceil(total / limit);
  const data = await qb.skip((page - 1) * limit).take(limit).getMany();

  return { data, total, page, limit, totalPages };
}
```

#### `GET /materias/:id` modificado — devolver carreras asociadas

```typescript
async obtenerConRelaciones(id: number, carreraId?: number): Promise<MateriaDetalle> {
  const materia = await this.materiaRepo.findOne({
    where: { materiaId: id },
    relations: {
      correlativasRequeridas: { materiaCorrelativa: true },
      esCorrelativaDe: { materia: true },
      planEstudios: { carrera: true },  // ya existe
    },
  });

  // Agrupar carreras únicas
  const carreras = materia.planEstudios
    .filter(cm => cm.carrera.activo)
    .map(cm => ({
      carreraId: cm.carrera.carreraId,
      nombre: cm.carrera.nombre,
      anio: cm.anio,
      cuatrimestre: cm.cuatrimestre,
      orden: cm.orden,
    }));

  return { ...materia, carreras };
}
```

### 3.5 Reglas de soft-delete

- **Al eliminar una carrera:** set `activo = false`. NO se eliminan registros relacionados (`usuario_carrera`,
  `carrera_materia`, `progreso_materia`, `periodo_planificacion`, `trayectoria`). El progreso de usuarios
  existente se conserva intacto. La carrera simplemente deja de aparecer en el frontend para nuevos usuarios.
- **Al eliminar una materia:** set `activo = false`. NO se eliminan registros en `carrera_materia`,
  `correlativa`, `progreso_materia`, `materia_planificada`. Las planificaciones existentes que la referencien
  se conservan.
- **Al restaurar:** set `activo = true`. La entidad vuelve a aparecer en listados.
- **Validación al eliminar:** si la carrera/materia ya está `activo = false`, retornar `400 Bad Request`.
- **Validación al restaurar:** si ya está `activo = true`, retornar `400 Bad Request`.

---

## 4. Frontend

### 4.1 Estructura de archivos nueva

```
pages/
├── AdminPage.tsx                    # Refactor: solo 2 tabs (Carreras, Materias)
├── CarreraEditPage.tsx              # NUEVA: editar carrera + plan de estudios + correlativas
├── MateriaDetailPage.tsx            # NUEVA: detalle de materia (info + carreras + correlativas)
├── MateriaEditPage.tsx              # NUEVA: editar materia

components/admin/
├── AdminTabs.tsx                    # Refactor: solo tabs Carreras | Materias
├── TablaCarreras.tsx                # NUEVA: tabla con datos, buscador, filtros, acciones
├── TablaMaterias.tsx                # NUEVA: tabla con datos, buscador, filtros, acciones
├── FiltrosModal.tsx                 # NUEVA: modal de filtros y ordenamiento (reutilizable)
├── CrearCarreraModal.tsx            # Sin cambios (ya existe)
├── CrearMateriaModal.tsx            # Sin cambios (ya existe)
├── PlanEstudiosAdmin.tsx            # SE ELIMINA (pasa a CarreraEditPage)
├── MateriaCorrelativasAdmin.tsx     # SE ELIMINA (pasa a CarreraEditPage)
├── PlanEstudiosEditor.tsx           # NUEVA: editor de plan de estudios dentro de CarreraEditPage
├── CorrelativasEditor.tsx           # NUEVA: editor de correlativas dentro de CarreraEditPage
└── ConfirmarEliminarModal.tsx       # NUEVA: modal de confirmación de soft-delete

hooks/
├── useAdminCarreras.ts              # Modificado: agregar update, delete, restore, search/filter
├── useAdminMaterias.ts              # Modificado: agregar update, delete, restore, search/filter
└── useMateriaDetalle.ts             # NUEVA: query para detalle de materia

services/carreras.service.ts         # Modificado: agregar métodos faltantes
types/
├── carrera.types.ts                 # Modificado: agregar ActualizarCarreraDto, tipos de filtro
└── materia.types.ts                 # Modificado: agregar MateriaDetalleConCarreras, tipos de filtro
```

### 4.2 Refactor de `AdminPage`

De 4 tabs a 2 tabs:

```typescript
type TabKey = 'carreras' | 'materias';
```

- Tab Carreras: renderiza `<TablaCarreras />`
- Tab Materias: renderiza `<TablaMaterias />`
- Se eliminan las dependencias de `PlanEstudiosAdmin` y `MateriaCorrelativasAdmin`

### 4.3 Componente `Paginador` (nuevo componente UI reutilizable)

Barra de paginación que muestra:

- Texto: `"Mostrando {desde}-{hasta} de {total} resultados"`
- Botones: `[Anterior]` `[1]` `[2]` `[...]` `[N]` `[Siguiente]`
- Select de resultados por página: `20 | 50 | 100`

Props:
```typescript
interface PaginadorProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}
```

### 4.4 Componente `TablaCarreras`

Tabla con las columnas:

| Columna | Descripción |
|---|---|
| Nombre | Link a detalle (`/carreras/:id`) |
| Descripción | Texto truncado (máx 100 chars) |
| Duración | `{duracionAnios} años` |
| Materias en plan | Chip con el total |
| Estado | Badge "Activa" / "Inactiva" (solo si `incluirInactivos=true`) |
| Acciones | 3 botones: `[Detalle]` `[Editar]` `[Eliminar]` |

#### Estado de paginación (local en `TablaCarreras`)

```typescript
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(20);
// Al cambiar search o filtros, resetear a page=1
```

#### Buscador
- Input de texto sobre la tabla.
- Debounce 300ms.
- Al escribir, resetea a `page = 1` y filtra por `search` query param al backend.
- Placeholder: `"Buscar carreras por nombre..."`.

#### Filtros y ordenamiento (modal)
Al hacer clic en un botón "Filtrar" sobre la tabla, se abre `<FiltrosModal>` con:

- **Ordenar por:** select con opciones `Nombre (A-Z)`, `Nombre (Z-A)`, `Duración (menor a mayor)`, `Duración (mayor a menor)`.
- **Incluir inactivas:** checkbox para mostrar carreras soft-deleteadas (útil para recuperación).
- Botones `[Aplicar]` `[Limpiar]`.

#### Acciones

| Acción | Comportamiento |
|---|---|
| Detalle | Navega a `/carreras/:id` (reutiliza `CarreraDetailPage` existente) |
| Editar | Navega a `/admin/carreras/:id/editar` (`CarreraEditPage`) |
| Eliminar | Modal de confirmación → `DELETE /carreras/:id` (soft-delete). Si ya está inactiva, ocultar botón o mostrar "Restaurar". |

#### Paginación
- `<Paginador>` debajo de la tabla.
- Al cambiar de página, se actualiza `page` y se dispara la query con el nuevo offset.
- Al cambiar `limit`, se resetea a `page = 1`.

### 4.5 Componente `TablaMaterias`

Tabla con las columnas:

| Columna | Descripción |
|---|---|
| Código | `codigo` |
| Nombre | Link a detalle (`/admin/materias/:id`) |
| Carga Horaria | `{cargaHoraria}h` |
| Créditos | Número |
| Carreras asociadas | Cantidad de carreras que la contienen (chip) |
| Estado | Badge "Activa" / "Inactiva" |
| Acciones | 3 botones: `[Detalle]` `[Editar]` `[Eliminar]` |

#### Estado de paginación (local en `TablaMaterias`)

```typescript
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(20);
```

#### Buscador
- Input con debounce 300ms.
- Busca por `nombre` y `codigo` (backend: `WHERE nombre LIKE OR codigo LIKE`).
- Al escribir, resetea a `page = 1`.
- Placeholder: `"Buscar materias por nombre o código..."`.

#### Filtros y ordenamiento (modal)
Mismo `<FiltrosModal>` reutilizado con opciones:

- **Ordenar por:** `Nombre (A-Z)`, `Nombre (Z-A)`, `Créditos (menor a mayor)`, `Créditos (mayor a menor)`, `Carga horaria (menor a mayor)`, `Carga horaria (mayor a menor)`.
- **Incluir inactivas:** checkbox.

#### Acciones

| Acción | Comportamiento |
|---|---|
| Detalle | Navega a `/admin/materias/:id` (`MateriaDetailPage`) |
| Editar | Navega a `/admin/materias/:id/editar` (`MateriaEditPage`) |
| Eliminar | Modal de confirmación → `DELETE /materias/:id` (soft-delete) |

#### Paginación
- `<Paginador>` debajo de la tabla con mismo comportamiento que en `TablaCarreras`.

### 4.6 `FiltrosModal` (reutilizable)

Props:
```typescript
interface FiltrosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FiltrosState) => void;
  sortOptions: { value: string; label: string }[];
  defaultValues?: FiltrosState;
}

interface FiltrosState {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  incluirInactivos: boolean;
}
```

### 4.7 `CarreraEditPage` — Página de edición de carrera

Ruta: `/admin/carreras/:id/editar`

#### Secciones

1. **Datos generales** — formulario (RHF + Zod) con:
   - `nombre` (input, 3–200 chars)
   - `descripcion` (textarea, opcional)
   - `duracionAnios` (number input, 1–10, step 0.5)
   - Botón `[Guardar cambios]` → `PUT /carreras/:id`

2. **Plan de estudios** — reutiliza la lógica del actual `PlanEstudiosAdmin`:
   - Select de materia (solo materias activas) + año + cuatrimestre + orden → botón `[Agregar al plan]`
   - Árbol Año→Cuatrimestre con materias del plan
   - Cada materia en el árbol tiene botón `[Quitar del plan]` → `DELETE /carreras/:id/materias/:carreraMateriaId`
   - Chip neon-cyan con total de materias

3. **Correlativas** — reutiliza la lógica del actual `MateriaCorrelativasAdmin`:
   - Select de materia del plan de esta carrera
   - Muestra sus correlativas actuales (filtradas por esta carrera) con botón `[Quitar]`
   - Select de "materia correlativa" (filtra la propia y las ya asignadas) + botón `[Asignar correlativa]`
   - Previene auto-referencia y duplicados

#### Navegación
- Breadcrumb: `Admin > Carreras > {nombre} > Editar`
- Botón "Volver" que navega a `/admin`

### 4.8 `MateriaDetailPage` — Página de detalle de materia

Ruta: `/admin/materias/:id`

#### Secciones

1. **Encabezado** — nombre, código, badges de carga horaria y créditos

2. **Información general** (Card):
   - Nombre
   - Código
   - Descripción
   - Carga horaria
   - Créditos

3. **Carreras que la contienen** (Card con tabla):
   - Columnas: Carrera, Año, Cuatrimestre, Orden
   - Cada carrera es un link a `/carreras/:carreraId`

4. **Correlativas** (Card):
   - **Correlativas requeridas** — lista de materias que se necesitan cursar antes que esta
     - Cada item: código + nombre + botón `[Ver materia]` que navega a `/admin/materias/:correlativaId`
   - **Es correlativa de** — lista de materias que requieren esta como correlativa
     - Cada item: código + nombre + botón `[Ver materia]`

#### Navegación
- Breadcrumb: `Admin > Materias > {nombre}`
- Botón "Volver" que navega a `/admin`
- Botón "Editar" que navega a `/admin/materias/:id/editar`

### 4.9 `MateriaEditPage` — Página de edición de materia

Ruta: `/admin/materias/:id/editar`

Formulario (RHF + Zod) con:
- `nombre` (input, ≤200)
- `codigo` (input, ≤20, deshabilitado si no se permite cambiar)
- `descripcion` (textarea, opcional)
- `cargaHoraria` (number input, ≥1)
- `creditos` (number input, ≥1)
- Botón `[Guardar cambios]` → `PUT /materias/:id`

La gestión de correlativas NO se hace desde acá. Se hace desde la edición de cada carrera que contiene la materia.

#### Navegación
- Breadcrumb: `Admin > Materias > {nombre} > Editar`
- Botón "Volver" que navega a `/admin/materias/:id`

### 4.10 Routing

```typescript
// Nuevas rutas en routes/index.tsx (dentro del PrivateRoute > MainLayout)
'/admin/carreras/:id/editar' → CarreraEditPage
'/admin/materias/:id'       → MateriaDetailPage
'/admin/materias/:id/editar' → MateriaEditPage

// La ruta '/admin' se mantiene pero ahora AdminPage solo tiene 2 tabs
'/admin' → AdminPage
```

### 4.11 Modificaciones en servicios

#### `carreras.service.ts` — nuevos métodos

```typescript
async listarCarrerasAdmin(params?: {
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  incluirInactivos?: boolean;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<CarreraAdminRow>> {
  const response = await api.get('/carreras', { params });
  return response.data;
}

async actualizarCarrera(id: number, data: ActualizarCarreraDto): Promise<Carrera> {
  const response = await api.put(`/carreras/${id}`, data);
  return response.data;
}

async eliminarCarrera(id: number): Promise<void> {
  await api.delete(`/carreras/${id}`);
}

async restaurarCarrera(id: number): Promise<Carrera> {
  const response = await api.patch(`/carreras/${id}/restore`);
  return response.data;
}

async quitarMateriaDelPlan(carreraId: number, carreraMateriaId: number): Promise<void> {
  await api.delete(`/carreras/${carreraId}/materias/${carreraMateriaId}`);
}
```

#### `materiasAdminService` — nuevos métodos

```typescript
async listarMateriasAdmin(params?: {
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  incluirInactivos?: boolean;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<MateriaAdminRow>> {
  const response = await api.get('/materias', { params });
  return response.data;
}

async actualizarMateria(id: number, data: ActualizarMateriaDto): Promise<Materia> {
  const response = await api.put(`/materias/${id}`, data);
  return response.data;
}

async eliminarMateria(id: number): Promise<void> {
  await api.delete(`/materias/${id}`);
}

async restaurarMateria(id: number): Promise<Materia> {
  const response = await api.patch(`/materias/${id}/restore`);
  return response.data;
}
```

### 4.12 Nuevos tipos

#### `carrera.types.ts`

```typescript
export interface ActualizarCarreraDto {
  nombre?: string;
  descripcion?: string;
  duracionAnios?: number;
}

export interface CarreraAdminRow {
  carreraId: number;
  nombre: string;
  descripcion: string | null;
  duracionAnios: number;
  activo: boolean;
  totalMaterias: number;
}
```

#### `materia.types.ts`

```typescript
export interface ActualizarMateriaDto {
  nombre?: string;
  codigo?: string;
  descripcion?: string;
  cargaHoraria?: number;
  creditos?: number;
}

export interface MateriaAdminRow extends Materia {
  activo: boolean;
  totalCarreras: number;
}

export interface MateriaDetalle extends Materia {
  correlativas: Correlativa[];
  carreras: {
    carreraId: number;
    nombre: string;
    anio: number;
    cuatrimestre: number;
    orden: number;
  }[];
}
```

### 4.13 Modificaciones en hooks

#### `useAdminCarreras.ts`

```typescript
// Mutaciones nuevas:
useMutation({ mutationFn: (data) => carrerasService.actualizarCarrera(id, data) })
useMutation({ mutationFn: (id) => carrerasService.eliminarCarrera(id) })
useMutation({ mutationFn: (id) => carrerasService.restaurarCarrera(id) })
useMutation({ mutationFn: ({carreraId, carreraMateriaId}) => carrerasService.quitarMateriaDelPlan(carreraId, carreraMateriaId) })

// Query con filtros y paginación:
useQuery({
  queryKey: ['carreras', 'admin', filters, page, limit],
  queryFn: () => carrerasService.listarCarrerasAdmin({ ...filters, page, limit }),
})
```

#### `useAdminMaterias.ts`

```typescript
// Mutaciones nuevas:
useMutation({ mutationFn: (data) => materiasAdminService.actualizarMateria(id, data) })
useMutation({ mutationFn: (id) => materiasAdminService.eliminarMateria(id) })
useMutation({ mutationFn: (id) => materiasAdminService.restaurarMateria(id) })

// Query con filtros y paginación:
useQuery({
  queryKey: ['materias', 'admin', filters, page, limit],
  queryFn: () => materiasAdminService.listarMateriasAdmin({ ...filters, page, limit }),
})
```

#### `useMateriaDetalle.ts` — nuevo hook

```typescript
export function useMateriaDetalle(id: number) {
  return useQuery({
    queryKey: ['materia', 'detalle', id],
    queryFn: () => materiasAdminService.obtenerMateria(id),
    enabled: !!id,
  });
}
```

### 4.14 Snackbar notifications

El proyecto ya cuenta con un sistema de notificaciones vía `useNotificationStore` (zustand) y el componente
`<Snackbar>` (fijo en bottom-right, auto-dismiss 3s success/info, 5s error). Todas las mutaciones deben
usar `addNotification(message, type)` para feedback al usuario.

#### Mensajes definidos por acción

| Acción | Mensaje success | Mensaje error |
|---|---|---|
| Crear carrera | `"Carrera creada correctamente"` | `"Error al crear la carrera"` |
| Actualizar carrera | `"Carrera actualizada correctamente"` | `"Error al actualizar la carrera"` |
| Eliminar carrera (soft-delete) | `"Carrera desactivada"` | `"Error al desactivar la carrera"` |
| Restaurar carrera | `"Carrera restaurada correctamente"` | `"Error al restaurar la carrera"` |
| Crear materia | `"Materia creada correctamente"` | `"Error al crear la materia"` |
| Actualizar materia | `"Materia actualizada correctamente"` | `"Error al actualizar la materia"` |
| Eliminar materia (soft-delete) | `"Materia desactivada"` | `"Error al desactivar la materia"` |
| Restaurar materia | `"Materia restaurada correctamente"` | `"Error al restaurar la materia"` |
| Agregar materia al plan | `"Materia agregada al plan"` | `"Error al agregar materia al plan"` |
| Quitar materia del plan | `"Materia quitada del plan"` | `"Error al quitar materia del plan"` |
| Asignar correlativa | `"Correlativa asignada"` | `"Error al asignar correlativa"` |
| Eliminar correlativa | `"Correlativa eliminada"` | `"Error al eliminar correlativa"` |

#### Implementación en hooks

Cada nueva mutación debe seguir el patrón existente:

```typescript
const actualizarCarrera = useMutation({
  mutationFn: (data: ActualizarCarreraDto) => carrerasService.actualizarCarrera(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['carreras', 'admin'] });
    addNotification('Carrera actualizada correctamente', 'success');
  },
  onError: () => {
    addNotification('Error al actualizar la carrera', 'error');
  },
});
```

---

## 5. Eliminación de componentes obsoletos

| Archivo | Acción |
|---|---|
| `components/admin/PlanEstudiosAdmin.tsx` | Eliminar |
| `components/admin/MateriaCorrelativasAdmin.tsx` | Eliminar |
| `components/admin/AdminTabs.tsx` | Refactor (quitar tabs "plan" y "correlativas") |

Las funcionalidades de `PlanEstudiosAdmin` y `MateriaCorrelativasAdmin` se migran a `PlanEstudiosEditor` y
`CorrelativasEditor` respectivamente, dentro de `CarreraEditPage`.

---

## 6. Reglas de negocio

| Regla | Detalle |
|---|---|
| Soft-delete carrera | No afecta progreso existente de usuarios. La carrera deja de ser visible en listados admin y en inscripción de nuevos usuarios. |
| Soft-delete materia | No afecta planes de estudio existentes ni progreso. La materia deja de ser visible en listados admin y en selectores de "agregar materia al plan". |
| Restaurar carrera | Recupera visibilidad en listados. Las carreras de usuarios que estaban inscriptos antes del soft-delete siguen funcionando normalmente. |
| Restaurar materia | Recupera visibilidad. Vuelve a aparecer en el catálogo para agregar a planes. |
| Eliminar materia del plan | `DELETE /carreras/:id/materias/:carreraMateriaId` — elimina el registro `carrera_materia`. NO elimina la materia del catálogo ni afecta correlativas. |
| Correlativas desde carrera | Las correlativas se gestionan por carrera (columna `carrera_id` en `correlativa`). Al editar una carrera se ven solo las correlativas scoped a esa carrera más las globales (`carrera_id IS NULL`). |

---

## 7. Orden de implementación sugerido

| Paso | Descripción | Archivos |
|---|---|---|
| 1 | Migración BD: agregar `activo` a `carrera` y `materia` | migration SQL / TypeORM |
| 2 | Entidades: agregar `activo` en `Carrera` y `Materia` | entities |
| 3 | DTOs de actualización y filtros | `actualizar-carrera.dto.ts`, `actualizar-materia.dto.ts`, `filtrar-carreras.dto.ts`, `filtrar-materias.dto.ts` |
| 4 | Modificar `CarrerasService.listar()` con search/filter/sort | `carreras.service.ts` |
| 5 | Modificar `MateriasService.listar()` con search/filter/sort | `materias.service.ts` |
| 6 | Agregar `actualizar()`, `eliminar()`, `restaurar()` en ambos servicios | services |
| 7 | Agregar endpoint `DELETE /carreras/:id/materias/:carreraMateriaId` | `carreras.service.ts` + `carreras.controller.ts` |
| 8 | Modificar `GET /materias/:id` para incluir carreras asociadas | `materias.service.ts` |
| 9 | Agregar endpoints PUT/DELETE/PATCH en controllers | controllers |
| 10 | Refactor `AdminTabs` a solo 2 tabs + `AdminPage` | `AdminTabs.tsx`, `AdminPage.tsx` |
| 11 | Componente `Paginador` (UI reutilizable) | `components/ui/Paginador.tsx` |
| 12 | Componente `TablaCarreras` + `TablaMaterias` + `FiltrosModal` | componentes nuevos |
| 13 | Nuevos métodos en `carreras.service.ts` y `materiasAdminService` (frontend) | services |
| 14 | Nuevos tipos frontend | `carrera.types.ts`, `materia.types.ts` |
| 15 | Modificar `useAdminCarreras` y `useAdminMaterias` | hooks |
| 16 | Hook `useMateriaDetalle` | nuevo hook |
| 17 | Página `CarreraEditPage` con formulario + `PlanEstudiosEditor` + `CorrelativasEditor` | page + componentes |
| 18 | Página `MateriaDetailPage` | page |
| 19 | Página `MateriaEditPage` | page |
| 20 | Routing: nuevas rutas en `routes/index.tsx` + `lazy-pages.tsx` | routes |
| 21 | Eliminar `PlanEstudiosAdmin.tsx` y `MateriaCorrelativasAdmin.tsx` | limpieza |

---

## 8. Notas adicionales

- El componente `FiltrosModal` debe ser genérico y reutilizable entre `TablaCarreras` y `TablaMaterias`.
- Los `sortOptions` cambian según la tabla; se pasan como prop.
- La `CarreraDetailPage` existente (`/carreras/:id`) se reutiliza sin cambios para el detalle de carrera desde admin.
- Las rutas de admin para detalle/edición de materia llevan prefijo `/admin/` para distinguirlas de las rutas
  de usuario.
- El breadcrumb en las páginas de edición/detalle debe permitir navegar hacia atrás: `Admin → Carreras → {nombre} → Editar`.
- Al hacer soft-delete de una carrera, si hay usuarios inscriptos, su progreso y planificaciones siguen
  funcionando con normalidad. La carrera solo se oculta de los listados públicos y admin (a menos que se
  filtre con `incluirInactivos`).
- La recuperación de carreras/materias es una acción exclusiva de admin: botón "Restaurar" visible solo
  cuando `incluirInactivos = true`.
