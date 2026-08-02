# Refactor del Módulo Admin — Documento de Implementación

## 1. Resumen del requerimiento

El módulo admin actual tiene 4 pestañas (Carreras, Materias, Plan de estudios, Correlativas) con una UX mínima
(listados simples sin búsqueda, filtros ni ordenamiento). Se requiere refactorizar a **2 pestañas** (Carreras,
Materias) con tabla de datos, buscador, filtros/orden, acciones CRUD, baja lógica y nuevas páginas de
detalle/edición. La gestión del plan de estudios y correlativas se traslada a la página de edición de cada
carrera.

### Cambios principales

| Actual | Nuevo |
|---|---|
| 4 tabs (Carreras, Materias, Plan, Correlativas) | 2 tabs (Carreras, Materias) |
| Listado simple sin búsqueda ni filtros | Tabla con buscador, filtros, ordenamiento y paginación |
| Sin acciones (solo crear) | Acciones: detalle, editar, eliminar (por fila) |
| Sin baja lógica | Baja lógica en `carrera` (columna `activo`, datos preservados). Baja lógica con purge en `materia` (columna `activo` + DELETE en cascada). Baja física al quitar materia del plan. |
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
-- Baja lógica: activo en carrera y materia
ALTER TABLE carrera
    ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD INDEX idx_carrera_activo (activo);

ALTER TABLE materia
    ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD INDEX idx_materia_activo (activo);

-- Unique en nombres
ALTER TABLE carrera
    ADD CONSTRAINT uk_carrera_nombre UNIQUE (nombre);

ALTER TABLE materia
    ADD CONSTRAINT uk_materia_nombre UNIQUE (nombre);
```

El backend debe capturar `ER_DUP_ENTRY` al crear/actualizar y retornar `400 Bad Request`
con mensaje `"Ya existe una carrera/materia con ese nombre"`.

---

## 3. Backend

### 3.1 Modificaciones en entidades

#### `Carrera` entity

```typescript
// Agregar decoradores (importar Unique de typeorm):
@Entity('carrera')
@Unique(['nombre'])              // ← nuevo
export class Carrera {
  // ...
  @Column({ default: true })
  activo: boolean;               // ← nuevo
}
// Alternativa: @Column({ length: 200, unique: true }) sobre nombre
```

#### `Materia` entity

```typescript
// Agregar decoradores (importar Unique de typeorm):
@Entity('materia')
@Unique(['nombre'])              // ← nuevo (además del unique en codigo)
export class Materia {
  // ...
  @Column({ default: true })
  activo: boolean;               // ← nuevo
}
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
| `GET` | `/carreras` | **Modificado:** requiere autenticación. Acepta query params `search`, `sortBy`, `sortOrder`, `incluirInactivos`, `page`, `limit`. Respuesta paginada `{ data, total, page, limit, totalPages }`. Por defecto filtra `activo = true`. Sin params, retorna todas las activas (compatibilidad hacia atrás). |
| `GET` | `/carreras/:id` | **Modificado:** incluye `planEstudios` con datos de plan + correlativas por materia. |
| `PUT` | `/carreras/:id` | **Nuevo:** actualizar datos de la carrera. |
| `DELETE` | `/carreras/:id` | **Nuevo:** baja lógica (set `activo = false`). |
| `PATCH` | `/carreras/:id/restore` | **Nuevo:** restaurar carrera (set `activo = true`). |
| `GET` | `/carreras/:id/plan-estudios` | Sin cambios (ya existe). |
| `POST` | `/carreras/:id/materias` | Sin cambios (ya existe). |
| `DELETE` | `/carreras/:id/materias/:carreraMateriaId` | **Nuevo:** baja física del registro `carrera_materia`. En cascada: DELETE de `MateriaPlanificada`, `ProgresoMateria` y `Correlativa` scoped a esa `(carreraId, materiaId)`. Irreversible. |

#### MateriasController

| Método | Ruta | Cambio |
|---|---|---|
| `GET` | `/materias` | **Modificado:** requiere autenticación. Acepta query params `search`, `sortBy`, `sortOrder`, `incluirInactivos`, `page`, `limit`. Respuesta paginada `{ data, total, page, limit, totalPages }`. Por defecto filtra `activo = true`. Sin params, retorna todas las activas (compatibilidad hacia atrás). |
| `GET` | `/materias/:id` | **Modificado:** además de correlativas, devuelve lista de carreras que contienen esta materia (desde `planEstudios`). |
| `PUT` | `/materias/:id` | **Nuevo:** actualizar datos de la materia. |
| `DELETE` | `/materias/:id` | **Nuevo:** baja lógica con purge (set `activo = false` + DELETE en cascada de datos relacionados). |
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

> ℹ️ El método `obtenerConRelaciones()` ya existe en `materias.service.ts` y ya carga `planEstudios: { carrera: true }`. El cambio es mínimo: agregar el mapeo a `carreras[]` en la respuesta.

```typescript
async obtenerConRelaciones(id: number, carreraId?: number): Promise<MateriaDetalle> {
  const materia = await this.materiaRepo.findOne({
    where: { materiaId: id, activo: true },
    relations: {
      correlativasRequeridas: { materiaCorrelativa: true },
      esCorrelativaDe: { materia: true },
      planEstudios: { carrera: true },
    },
  });
  if (!materia) throw new NotFoundException('Materia no encontrada o desactivada');

  // Agrupar carreras únicas (solo activas)
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

### 3.5 Reglas de borrado (baja lógica y física)

#### Baja lógica de carrera (`carrera.activo = false`)
- NO se eliminan registros relacionados (`usuario_carrera`, `carrera_materia`, `progreso_materia`,
  `periodo_planificacion`, `trayectoria`).
- **Usuario regular:** la carrera desaparece **completamente** de toda la app:
  - No aparece en el selector del navbar
  - No aparece en el Dashboard
  - No aparece en `/carreras` ni en `/carreras/disponibles`
  - No aparece en Progreso
  - No aparece en Planificaciones ni Trayectorias
  - Si el usuario intenta acceder a `/carreras/:id` → redirige a 404 o listado
  - El `usuario_carrera` existe en BD pero el frontend lo filtra (solo query admin lo trae)
- **Admin:** puede verla desde AdminPage con `incluirInactivos=true`, y restaurarla.

#### Baja lógica de materia con purge en cascada (`materia.activo = false`)

> ⚠️ A diferencia de carrera, esta operación **no es un soft-delete puro**: aunque conserva el flag `activo = false` en la tabla `materia`, elimina físicamente todos los datos relacionados. Es una operación destructiva: al restaurar la materia vuelve al catálogo **sin datos asociados**.

En una transacción:
1. Set `materia.activo = false`.
2. DELETE físico de todos los `CarreraMateria` que referencien esta `materiaId` (ya no pertenece a ningún plan).
3. DELETE físico de todos los `MateriaPlanificada` para esta `materiaId` en cualquier período de cualquier
   usuario. Los bloques horarios quedan libres.
4. DELETE físico de todos los `ProgresoMateria` para esta `materiaId` en cualquier `usuarioCarrera`.
5. DELETE físico de todas las `Correlativa` que referencien esta `materiaId` (como origen o destino),
   tanto globales como scoped a cualquier carrera.

- **Usuario regular:** no la ve en ningún lado: catálogo, plan de estudios, progreso, planificaciones
  ni trayectorias. Es como si nunca hubiera existido.
- **Admin:** puede verla desde AdminPage con `incluirInactivos=true` y restaurarla, pero solo recupera el nombre/código — progreso, planes y correlativas se pierden permanentemente.

#### Baja física de materia del plan (`DELETE /carreras/:id/materias/:carreraMateriaId`)

Operación irreversible que elimina físicamente:

1. El registro `carrera_materia` (la materia ya no pertenece al plan de esa carrera).
2. Todos los `MateriaPlanificada` para esa `(materiaId, carreraId)` en cualquier período de cualquier
   usuario. Los bloques horarios quedan libres.
   ```sql
   DELETE mp FROM materia_planificada mp
   INNER JOIN periodo_planificacion pp ON mp.periodo_id = pp.periodo_id
   INNER JOIN usuario_carrera uc ON pp.usuario_carrera_id = uc.usuario_carrera_id
   WHERE uc.carrera_id = :carreraId AND mp.materia_id = :materiaId
   ```
3. Todos los `ProgresoMateria` para esa `(materiaId, carreraId)`:
   ```sql
   DELETE FROM progreso_materia pm
   WHERE pm.materia_id = :materiaId
   AND pm.usuario_carrera_id IN (
     SELECT uc.usuario_carrera_id FROM usuario_carrera uc WHERE uc.carrera_id = :carreraId
   )
   ```
4. Todas las `Correlativa` con `carrera_id = :carreraId` que referencien esta `materia_id`.

**Efecto en usuarios:** la materia nunca existió en el plan. No hay forma de recuperar los datos perdidos.
Si admin quiere incluirla de nuevo, usa el flujo normal "Agregar materia al plan" desde cero.

**Reglas comunes**
- **Restaurar carrera:** set `activo = true`. Vuelve a aparecer en listados con todos sus datos.
- **Restaurar materia:** set `activo = true`. Vuelve al catálogo pero **sin** planes, progreso, correlativas ni planificaciones previas (se perdieron en el purge).
- **Validación al desactivar carrera/materia:** si ya está `activo = false`, retornar `400`.
- **Validación al restaurar:** si ya está `activo = true`, retornar `400`.

### 3.6 Repercusión en endpoints — mapeo completo

Cada endpoint existente debe modificarse para respetar `activo` en `carrera` y `materia`.
`carrera_materia` no tiene `activo` (se elimina físicamente al quitar del plan).

#### Visibilidad de carrera desactivada (baja lógica) para usuarios

Los siguientes endpoints **deben filtrar** `carrera.activo = true` siempre que sean consultados
por un usuario regular. Los usuarios nunca ven carreras inactivas:

| Endpoint | Cambio |
|---|---|
| `GET /usuarios/:id/carreras` | Agregar `AND c.activo = true` en la relación. |
| `GET /usuarios/:id/carreras-activas` | Agregar `AND c.activo = true`. |
| `GET /carreras` (autenticado) | `WHERE c.activo = true` por defecto. Requiere `@ApiBearerAuth()`. Sin query params de paginación retorna array simple de activas (compatibilidad). |
| `GET /carreras/disponibles/:usuarioId` | Agregar `AND c.activo = true`. |
| `GET /carreras/:id` | Si `carrera.activo = false`, retornar `404`. |
| `GET /carreras/:id/plan-estudios` | Validar `carrera.activo = true` o 404. |
| `GET /dashboard/...` (estadísticas) | Excluir carreras inactivas. |
| `GET /planificacion/...` (todos los endpoints) | Al buscar por `usuarioCarreraId`, verificar que la carrera asociada esté activa. Si no, tratar como si no existiera. |

#### Filtros de materia (`materia.activo = true`)

| Endpoint | Cambio |
|---|---|
| `GET /materias` | `WHERE m.activo = true` por defecto. Admin pasa `incluirInactivos`. |
| `GET /materias/:id` | Si `materia.activo = false`, retornar `404`. En `carreras` asociadas, filtrar solo `carrera.activo = true`. |
| `GET /carreras/:id/plan-estudios` | Filtrar `materia.activo = true`. |
| `GET /planificacion/disponibles` | Al construir desde `carrera_materia`, la relación a `materia` debe excluir `activo = false`. |
| `POST /planificacion/periodos/:id/materias` | Validar que `materia.activo = true`. |
| `POST /materias/:id/correlativas` | Validar que ambas materias tengan `activo = true`. |

#### Baja física de `carrera_materia` — impacto

Al ejecutar `DELETE /carreras/:id/materias/:carreraMateriaId`, se elimina físicamente el registro
y en cascada todo lo relacionado. No hay filtros adicionales que agregar en otros endpoints:
simplemente el registro ya no existe, por lo que `JOIN` y `find` naturales no lo traerán.

Los endpoints que consultan el plan de estudios (`carrera_materia`) ya quedan limpios automáticamente.

#### Lógica de `obtenerMateriasDisponibles()` modificada

```typescript
const entries = await this.carreraMateriaRepo.find({
  where: { carrera: { carreraId } },  // sin filtro activo — los eliminados ya no están
  relations: { materia: { correlativasRequeridas: { materiaCorrelativa: true, carrera: true } } },
});
```

No se necesita validación extra de `carrera_materia.activo` en correlativas porque si el registro
fue eliminado, la correlativa scopeada a esa carrera también se eliminó en cascada.

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

hooks/
├── useAdminCarreras.ts              # Modificado: agregar update, delete, restore, search/filter
├── useAdminMaterias.ts              # Modificado: agregar update, delete, restore, search/filter
└── useMateriaDetalle.ts             # NUEVA: query para detalle de materia

services/carreras.service.ts         # Modificado: agregar métodos faltantes
types/
├── carrera.types.ts                 # Modificado: agregar ActualizarCarreraDto, tipos de filtro
└── materia.types.ts                 # Modificado: extender MateriaDetalle (ya existe) + nuevos tipos
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
| Acciones | 3 iconos: `[ver]` `[editar]` `[eliminar]` (ver detalle más abajo) |

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
- **Incluir inactivas:** checkbox para mostrar carreras desactivadas (útil para recuperación).
- Botones `[Aplicar]` `[Limpiar]`.

#### Acciones (iconos)

Cada fila tiene 3 botones-icono, reutilizando el componente `<Icon>` del proyecto (lucide-react):

| Icono | `iconName` | Acción | Comportamiento |
|---|---|---|---|
| `Eye` | `ver` | Detalle | Navega a `/carreras/:id` (reutiliza `CarreraDetailPage` existente) |
| `Pencil` | `edit` | Editar | Navega a `/admin/carreras/:id/editar` (`CarreraEditPage`) |
| `Trash2` | `delete` | Eliminar | Modal de confirmación → `DELETE /carreras/:id` (baja lógica). Si ya está inactiva, ocultar y mostrar icono `RefreshCw` con acción "Restaurar". |

Agregar `Eye` y `RefreshCw` a `components/ui/icons.ts`:
```typescript
import {
    // ... iconos existentes
    Eye,
    RefreshCw,
} from 'lucide-react';

export const Icons = {
    // ... iconos existentes
    books: BookOpen,
    search: Search,
    school: School,
    graduation: GraduationCap,
    chart: BarChart3,
    clock: Clock,
    briefcase: Briefcase,
    trending: TrendingUp,
    warning: AlertTriangle,
    dot: CircleDot,
    close: X,
    check: CheckCircle2,
    loading: Loader2,
    circle: Circle,
    calendar: CalendarDays,
    chevron: ChevronDown,
    panel: PanelLeft,
    collapse: ChevronsLeft,
    menu: Menu,
    edit: Pencil,
    delete: Trash2,
    arrowLeft: ArrowLeft,
    // Iconos nuevos para admin
    ver: Eye,
    restore: RefreshCw,
} as const;

export type IconName = keyof typeof Icons;
```

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
| Estado | Badge "Activa" / "Inactiva" (solo si `incluirInactivos=true`) |
| Acciones | 3 iconos: `[ver]` `[editar]` `[eliminar]` (ver detalle más abajo) |

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

#### Acciones (iconos)

Mismos iconos que `TablaCarreras`:

| `iconName` | Acción | Comportamiento |
|---|---|---|
| `ver` | Detalle | Navega a `/admin/materias/:id` (`MateriaDetailPage`) |
| `edit` | Editar | Navega a `/admin/materias/:id/editar` (`MateriaEditPage`) |
| `delete` | Eliminar | Modal de confirmación → `DELETE /materias/:id` (baja lógica con purge). Si está inactiva, mostrar `restore` para restaurar. |

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
   - Select de materia (solo `materia.activo = true` y que no esté ya en el plan)
     + año + cuatrimestre + orden → botón `[Agregar al plan]`
   - Árbol Año→Cuatrimestre con materias del plan
   - Cada materia en el árbol tiene botón icono `delete` para quitar del plan
     → `DELETE /carreras/:id/materias/:carreraMateriaId`
   - **Modal de confirmación obligatorio** advirtiendo que la operación es irreversible:
     ```
     "Estás por quitar '{codigo} - {nombre}' del plan de estudios.
     Esta acción es irreversible y eliminará permanentemente:
     • El progreso académico de todos los usuarios en esta materia para esta carrera
     • Todas las planificaciones que la incluyan (bloques horarios)
     • Las correlativas asociadas a esta materia en esta carrera
     Para volver a incluirla, deberás agregarla nuevamente desde cero."
     [Cancelar] [Quitar del plan]
     ```
   - No hay opción de restaurar (la eliminación es física). Para volver a tener la materia
     en el plan, usar el formulario "Agregar materia al plan".
    - Badge info con total de materias en el plan.

3. **Correlativas** — reutiliza la lógica del actual `MateriaCorrelativasAdmin`:
   - Select de materia del plan de esta carrera
   - Muestra sus correlativas actuales (filtradas por esta carrera) con botón icono `delete`
   - Select de "materia correlativa" + botón `[Asignar correlativa]`
   - Previene auto-referencia y duplicados
   - **Validación de orden en el plan** (solo para correlativas scoped a esta carrera):
     al asignar una correlativa, se verifica que la materia correlativa tenga `anio` menor,
     o mismo `anio` con `cuatrimestre` menor dentro del plan de esta carrera.
     Ejemplo: una materia de 2° año puede tener correlativas solo de 1° año.
     Si están en el mismo año, la correlativa debe estar en un cuatrimestre anterior (1° → 2°).
     Si están en el mismo cuatrimestre, se rechaza.
     El backend valida contra `carrera_materia.anio` y `carrera_materia.cuatrimestre` de ambas materias.
     Las correlativas globales (`carrera_id = NULL`) no se validan por orden ya que no están
     scoped a una carrera específica.

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

#### `carreras.service.ts` — modificaciones y nuevos métodos

> ⚠️ `obtenerCarrerasDisponibles()` existente (usa `GET /carreras` y espera `CarreraDisponible[]`) debe actualizarse para usar `obtenerCarrerasDisponiblesParaUsuario()` (que ya usa paginación contra `GET /carreras/disponibles/:usuarioId`), o adaptarse a la nueva respuesta paginada.

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

### 4.12 Tipos nuevos y modificaciones

#### `carrera.types.ts`

> ⚠️ Existe una interfaz `MateriaPlanEstudios` duplicada en `carrera.types.ts` (líneas 45 y 73, una sin `estadoUsuario/nota/tipoAprobacion` y otra con ellos). Se debe eliminar el duplicado y unificar. Además, `Carrera` usa `duracionEstimadaCuatrimestres` mientras el backend devuelve `duracionAnios` — hay que alinear el frontend al backend.

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

> ⚠️ `MateriaDetalle` ya existe en `materia.types.ts` con `correlativas: Correlativa[]`. Se **modifica** para agregar el campo `carreras[]`. Además, existe una interfaz `Correlativa` duplicada entre `carrera.types.ts` (con `estadoUsuario`, `nota`, `tipoAprobacion`) y `materia.types.ts` (sin esos campos). Se debe unificar en un solo tipo.

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
| Eliminar carrera (baja lógica) | `"Carrera desactivada"` | `"Error al desactivar la carrera"` |
| Restaurar carrera | `"Carrera restaurada correctamente"` | `"Error al restaurar la carrera"` |
| Crear materia | `"Materia creada correctamente"` | `"Error al crear la materia"` |
| Actualizar materia | `"Materia actualizada correctamente"` | `"Error al actualizar la materia"` |
| Eliminar materia (baja lógica con purge) | `"Materia desactivada. Progreso, planes y correlativas eliminados."` | `"Error al desactivar la materia"` |
| Restaurar materia | `"Materia restaurada correctamente"` | `"Error al restaurar la materia"` |
| Agregar materia al plan | `"Materia agregada al plan"` | `"Error al agregar materia al plan"` |
| Quitar materia del plan (baja física) | `"Materia quitada del plan. Progreso y planificaciones eliminados."` | `"Error al quitar materia del plan"` |
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
| Baja lógica carrera (admin) | `carrera.activo = false`. El usuario no la ve en ningún lado. Admin puede verla y restaurarla con `incluirInactivos=true`. Al restaurar recupera todos los datos asociados. |
| Baja lógica materia con purge (admin) | `materia.activo = false` + DELETE físico de `CarreraMateria`, `MateriaPlanificada`, `ProgresoMateria` y `Correlativa` para **todas las carreras**. Operación destructiva: al restaurar la materia vuelve al catálogo **sin datos asociados**. |
| Baja física materia del plan | `DELETE` físico de `carrera_materia`. En cascada elimina `MateriaPlanificada`, `ProgresoMateria` y `Correlativa` scoped a esa `(carrera, materia)`. Irreversible. Para volver a incluirla, usar "Agregar materia al plan". |
| Restaurar carrera | `activo = true`. Recupera visibilidad total con todos los datos asociados. |
| Restaurar materia | `activo = true`. Recupera visibilidad en catálogo pero sin planes, progreso, correlativas ni planificaciones (se perdieron en el purge). |
| Unique nombre carrera | No pueden existir dos carreras con el mismo nombre (validación backend + UNIQUE en BD). |
| Unique nombre materia | No pueden existir dos materias con el mismo nombre (además del unique ya existente en `codigo`). |
| Orden y año/cuatrimestre por carrera | `anio`, `cuatrimestre` y `orden` de una materia se almacenan en `carrera_materia` y son **por carrera**. Una misma materia puede estar en 1° año en una carrera y 3° año en otra. |
| Validación de correlativas por orden | Al asignar correlativa, se verifica que la materia correlativa tenga `anio` menor, o mismo `anio` con `cuatrimestre` menor dentro del plan de la carrera. Se rechazan correlativas del mismo cuatrimestre o posteriores. |
| Correlativas por carrera | Las correlativas se gestionan por carrera (columna `carrera_id` en `correlativa`). Al editar una carrera se ven solo las correlativas scoped a esa carrera más las globales (`carrera_id IS NULL`). |

---

## 7. Orden de implementación sugerido

| Paso | Descripción | Archivos |
|---|---|---|
| 1 | Migración BD: `activo` en `carrera` y `materia` + unique en `carrera.nombre` y `materia.nombre` | migration SQL / TypeORM |
| 2 | Entidades: agregar `activo` en `Carrera` y `Materia` | entities |
| 3 | DTOs de actualización y filtros | `actualizar-carrera.dto.ts`, `actualizar-materia.dto.ts`, `filtrar-carreras.dto.ts`, `filtrar-materias.dto.ts` |
| 4 | Modificar `CarrerasService.listar()` con search/filter/sort/pagination + filtrar `carrera.activo` | `carreras.service.ts` |
| 5 | Modificar `MateriasService.listar()` con search/filter/sort/pagination + filtrar `materia.activo` | `materias.service.ts` |
| 6 | Agregar `actualizar()`, `eliminar()`, `restaurar()` en ambos servicios (carrera/materia) + capturar `ER_DUP_ENTRY` en nombre | services |
| 7 | Agregar endpoint `DELETE /carreras/:id/materias/:carreraMateriaId` con cascada en `MateriaPlanificada`, `ProgresoMateria`, `Correlativa` | `carreras.service.ts` + `carreras.controller.ts` |
| 8 | Modificar `GET /materias/:id` para incluir carreras asociadas con sus `anio`, `cuatrimestre`, `orden` propios | `materias.service.ts` |
| 9 | Agregar validación de orden en `asignarCorrelativa()`: verificar año/cuatrimestre anterior en el plan | `materias.service.ts` |
| 10 | Agregar filtro `carrera.activo = true` en endpoints de usuario (carreras del usuario, disponibles, plan-estudios, progreso, planificaciones, dashboard) | controllers + services |
| 11 | Agregar filtro `materia.activo = true` en endpoints de catálogo, plan de estudios y disponibles | controllers + services |
| 12 | Agregar endpoints PUT/DELETE/PATCH en controllers | controllers |
| 13 | Refactor `AdminTabs` a solo 2 tabs + `AdminPage` | `AdminTabs.tsx`, `AdminPage.tsx` |
| 14 | Agregar iconos `Eye`, `RefreshCw` a `components/ui/icons.ts` | icons |
| 15 | Componente `Paginador` (UI reutilizable) | `components/ui/Paginador.tsx` |
| 16 | Componente `TablaCarreras` + `TablaMaterias` + `FiltrosModal` | componentes nuevos |
| 17 | Nuevos métodos en `carreras.service.ts` y `materiasAdminService` (frontend) | services |
| 18 | Nuevos tipos frontend | `carrera.types.ts`, `materia.types.ts` |
| 19 | Modificar `useAdminCarreras` y `useAdminMaterias` | hooks |
| 20 | Hook `useMateriaDetalle` | nuevo hook |
| 21 | Página `CarreraEditPage` con formulario + `PlanEstudiosEditor` + `CorrelativasEditor` | page + componentes |
| 22 | Página `MateriaDetailPage` | page |
| 23 | Página `MateriaEditPage` | page |
| 24 | Routing: nuevas rutas en `routes/index.tsx` + `lazy-pages.tsx` | routes |
| 25 | Eliminar `PlanEstudiosAdmin.tsx` y `MateriaCorrelativasAdmin.tsx` | limpieza |

---

## 8. Notas adicionales

- El componente `FiltrosModal` debe ser genérico y reutilizable entre `TablaCarreras` y `TablaMaterias`.
- Los `sortOptions` cambian según la tabla; se pasan como prop.
- La `CarreraDetailPage` existente (`/carreras/:id`) se reutiliza sin cambios para el detalle de carrera desde admin.
- Las rutas de admin para detalle/edición de materia llevan prefijo `/admin/` para distinguirlas de las rutas
  de usuario.
- El breadcrumb en las páginas de edición/detalle debe permitir navegar hacia atrás: `Admin → Carreras → {nombre} → Editar`.
- Al desactivar una carrera (baja lógica), los usuarios que ya estaban inscriptos pierden todo acceso a ella
  (no la ven en navbar, dashboard, carreras, progreso, planificaciones ni trayectorias). Los datos
  en BD persisten (`usuario_carrera`, `progreso_materia`, etc.), pero ningún endpoint de usuario
  los devuelve. Si el admin restaura la carrera, los usuarios recuperan el acceso completo.
- Al quitar una materia del plan (baja física), la operación es **irreversible** y afecta a **todos los
  usuarios** de esa carrera. El modal de confirmación debe dejar esto muy claro.
- La recuperación de carreras/materias desactivadas es exclusiva de admin: botón "Restaurar"
  (icono `RefreshCw`) visible solo cuando `incluirInactivos = true`.
- A diferencia de `carrera`, `carrera_materia` **no** tiene baja lógica. Al quitar
  una materia del plan se hace `DELETE` físico. Esto simplifica las validaciones: el registro
  simplemente no existe en la BD.
- Los `anio`, `cuatrimestre` y `orden` de una materia se definen **por carrera** en la tabla pivote
  `carrera_materia`. Una misma materia puede tener distinto año/cuatrimestre/orden según la carrera.
  Todos los endpoints de plan de estudios ya respetan esto; verificar que `TablaMaterias` y
  `MateriaDetailPage` también lo muestren correctamente en contexto de cada carrera.
- Los botones de acción en las tablas son iconos (lucide-react) sin texto, con `title` para
  accesibilidad: "Ver detalle", "Editar", "Eliminar", "Restaurar". Usan el componente `<Icon>`
  con `className` para colores hover: `hover:text-text-default`, `hover:text-accent-primary`, `hover:text-status-danger`.

---

## 9. Correcciones posteriores a la implementación

### 9.1 Columnas tipo raw query con snake_case

Al usar TypeORM `QueryBuilder` con `select`, `where`, `groupBy` y `orderBy`, los nombres de columna
deben coincidir con los de la base de datos, no con los de la entidad. Como no hay `NamingStrategy`
configurado y algunas columnas tienen nombre explícito via `@JoinColumn({ name: '...' })` o
`@Column({ name: '...' })`, se corrigieron las siguientes referencias:

| Archivo | Antes | Después |
|---|---|---|
| `carreras.service.ts` | `cm.carreraId` | `cm.carrera_id` |
| `carreras.service.ts` | `c.duracionAnios` | `c.duracion_anios` |
| `materias.service.ts` | `cm.materiaId` | `cm.materia_id` |
| `usuarios.service.ts` | `uc.usuarioId` | `uc.usuario_id` |
| `usuarios.service.ts` | `uc.fechaInicio` | `uc.fecha_inicio` |

### 9.2 Unique constraint en (carrera, anio, cuatrimestre, orden)

Para evitar duplicados de orden dentro del mismo año y cuatrimestre de una carrera, se agregó:

```typescript
// carrera-materia.entity.ts
@Unique(['carrera', 'anio', 'cuatrimestre', 'orden'])
```

Esto permite múltiples materias en el mismo año y cuatrimestre, pero no con el mismo orden.

### 9.3 Total de materias/carreras en listados admin

Las respuestas de `GET /carreras` y `GET /materias` ahora incluyen conteos agregados:

- **`totalMaterias`** en cada `CarreraAdminRow`: cantidad de materias en el plan de esa carrera.
  Se obtiene via subquery con `COUNT(*)` agrupado por `carrera_id` en `carrera_materia`.
- **`totalCarreras`** en cada `MateriaAdminRow`: cantidad de carreras que contienen esa materia.
  Se obtiene via subquery con `COUNT(*)` agrupado por `materia_id` en `carrera_materia`.

### 9.4 Delete de correlativa sin filtro carrera

El método `eliminarCorrelativa()` originalmente filtraba por `carreraId` en el `where`, pero
las correlativas pueden tener `carrera_id = NULL`. Al buscarlas con `carrera: { carreraId }`,
no se encontraban. Se corrigió eliminando el filtro de carrera:

```typescript
async eliminarCorrelativa(materiaId: number, correlativaId: number): Promise<void> {
    const correlativa = await this.correlativaRepo.findOne({
        where: { correlativaId, materia: { materiaId } },
    });
    // ...
}
```

El `correlativaId` es PK, suficiente para identificar el registro.

### 9.5 Delete de MateriaPlanificada y ProgresoMateria con `In()`

En `quitarMateriaDelPlan()`, el método `queryRunner.manager.delete()` no soporta condiciones
`where` con más de 1 nivel de relaciones anidadas. Se corrigió usando dos pasos:

```typescript
// Antes (falla):
await queryRunner.manager.delete(MateriaPlanificada, {
    materia: { materiaId },
    periodo: { usuarioCarrera: { carrera: { carreraId } } },
});

// Después:
const periodos = await queryRunner.manager.find(PeriodoPlanificacion, {
    where: { usuarioCarrera: { carrera: { carreraId } } },
    select: { periodoId: true },
});
const periodoIds = periodos.map((p) => p.periodoId);
if (periodoIds.length > 0) {
    await queryRunner.manager.delete(MateriaPlanificada, {
        materia: { materiaId },
        periodo: { periodoId: In(periodoIds) },
    });
}
```

También se corrigió el delete de `ProgresoMateria` donde el array de IDs se pasaba suelto
en lugar de usando `In()`:

```typescript
// Antes (falla):
usuarioCarrera: { usuarioCarreraId: usuarioCarreraIds }

// Después:
usuarioCarrera: { usuarioCarreraId: In(usuarioCarreraIds) }
```

### 9.6 Modal de confirmación para eliminar carrera

En `TablaCarreras.tsx`, el botón de eliminar ahora abre un modal con advertencia sobre las
consecuencias de la desactivación (usuarios pierden acceso, datos conservados). Solo al
confirmar se ejecuta la mutación `eliminarCarrera.mutate()`.

### 9.7 Paginador siempre visible

El `Paginador` se renderiza incluso cuando `totalPages <= 1`, para que el usuario vea el
total de resultados y pueda cambiar el límite por página. Se eliminó la condición
`data.totalPages > 1`.

### 9.8 Orden visible en plan de estudios

En `PlanEstudiosEditor`, cada materia en el plan muestra su `orden`:

```tsx
{m.nombre} <span className="text-text-muted">(orden {m.orden})</span>
```

### 9.9 Formularios centrados

Tanto `CarreraEditPage` como `MateriaEditPage` centran el formulario con `mx-auto`:

```tsx
<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-lg mx-auto">
```

### 9.10 ESLint: argsIgnorePattern para underscore

Se agregó la regla `@typescript-eslint/no-unused-vars` con `argsIgnorePattern: '^_'` en
`eslint.config.mjs` para permitir parámetros con prefijo underscore sin warning.

### 9.11 Correlativas mapeadas a `correlativas` en respuesta

El backend devuelve `correlativas` en lugar de `correlativasRequeridas` para que coincida
con la interfaz `MateriaDetalle` del frontend. El mapeo se hace en `obtenerConRelaciones()`:

```typescript
return { ...materia, correlativas };
```
