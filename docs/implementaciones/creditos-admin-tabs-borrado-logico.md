# Tabs de Categorías y Actividades de Créditos en Admin con borrado lógico

> **Estado:** Implementada (backend + frontend).
> Objetivo: llevar la gestión del **catálogo global** de `categoria_credito` y `actividad_credito`
> al módulo admin (`/admin`), con **edición** y **borrado lógico** (columna `activo`), de modo que
> **nunca se pierda el progreso** de los usuarios en `progreso_actividad`.

## 1. Problema

Hoy el catálogo global de créditos se gestiona de forma incompleta:

- El CRUD de categorías del catálogo **no existe** (solo `GET/POST /creditos/categorias`).
  No hay edición ni baja.
- Las actividades del catálogo solo se pueden **crear y editar** (`POST/GET/PUT /creditos/actividades`),
  pero **no se pueden dar de baja**.
- La única forma de "quitar" algo es sobre los **pivotes por carrera**
  (`DELETE /carreras/:id/creditos/categorias/:ccId` y `.../actividades/:caId`), que es un borrado
  físico del pivote, no del catálogo.

**Riesgo crítico que motiva el borrado lógico:** `progreso_actividad` tiene la FK `actividad_credito_id`
con `ON DELETE CASCADE`. Un `DELETE` físico sobre `actividad_credito`
**borraría en cascada el progreso de todos los usuarios**. Por eso toda baja del catálogo debe ser
**lógica** (`activo = false`), nunca física.

## 2. Requerimientos

1. Nuevos tabs en `/admin` para administrar **Categorías de créditos** y **Actividades de créditos**
   del catálogo global.
2. **Edición** de cada categoría (nombre, descripción) y de cada actividad (nombre, descripción, créditos).
3. **Borrado lógico** de categorías y actividades con confirmación y aviso de consecuencias.
4. **Restauración** de categorías y actividades dadas de baja.
5. El progreso de los usuarios **se conserva** en todo momento (no se borra nada físicamente).
6. Como en el borrado de carreras, lo inactivo **no aparece para los usuarios**: desaparece de las
   vistas de usuario y deja de sumar créditos hasta que se restaure (las filas quedan en la base).

## 3. Decisiones de diseño

### 3.1 Borrado lógico con flag `activo`

Ambas entidades **ya tienen la columna `activo`** (`boolean`, default `true`) — no se agrega nada a la base.

| Entidad | Columna | Uso actual | Uso nuevo |
|---|---|---|---|
| `categoria_credito` | `activo` | `listarCategorias(incluirInactivas)` filtra por defecto `activo: true` | marcar `false` en baja, `true` en restauración |
| `actividad_credito` | `activo` | **no se usa en backend** (`listarActividades` no filtra) | marcar `false` en baja, `true` en restauración; alinear `listarActividades` |

No hay `@DeleteDateColumn`/`softDelete` en el repo: el patrón del proyecto es la bandera booleana
`activo` + endpoints `DELETE :id` (baja lógica) y `PATCH :id/restore` (ver `carreras`, `materias`).

### 3.2 Cascada lógica: baja de categoría baja sus actividades

Al dar de baja una categoría se marcan también `activo = false` **todas sus actividades** (misma
transacción). Motivo: mantener coherente el catálogo (no pueden quedar actividades activas bajo una
categoría inactiva; la pestaña de actividades se agrupa por categoría).

- La **restauración de la categoría solo restaura la categoría**; cada actividad conserva su propio
  estado `activo` y se restaura individualmente (botón por fila).
- Una actividad solo **cuenta / es visible para los usuarios cuando tanto ella como su categoría están
  activas** (el filtro de §4.3 exige ambos). Restaurar una actividad cuya categoría sigue inactiva la
  deja oculta hasta que se restaure también la categoría.
- No se toca `progreso_actividad`, ni los pivotes por carrera (`carrera_categoria_credito`,
  `carrera_actividad_credito`), ni los requisitos.

### 3.3 Lo inactivo NO aparece para los usuarios (comportamiento como carreras)

Igual que `carreras-resumen` oculta las carreras con `activo = false`, las categorías y actividades
inactivas **desaparecen de toda vista de usuario**: no aparecen en la config de la carrera
(`GET /carreras/:id/creditos`), ni en `/creditos`, ni en el dashboard
(`GET /estadisticas/creditos-progreso`). El progreso en `progreso_actividad` **no se borra**, pero
las actividades inactivas **dejan de sumar créditos** mientras estén dadas de baja.

- **`obtenerConfiguracionCarrera` filtra `activo` siempre** (sin distinguir admin/usuario por
  `usuarioId`). Motivo: el controller de `GET /carreras/:id/creditos` **siempre** inyecta
  `req.user.usuarioId` del JWT (nunca está ausente), por lo que no se puede diferenciar "vista de
  usuario" de "vista admin" por la presencia de `usuarioId`. El editor admin tampoco muestra lo
  inactivo ya configurado; los pivotes quedan en la base y reaparecen al restaurar.
- **`obtenerProgreso` filtra `activo` siempre** (solo lo usa el usuario: `/creditos`, dashboard).
- Al **restaurar** la categoría y/o sus actividades (cada una activa), vuelven a aparecer en las
  carreras donde estaban configuradas y a contar para el usuario (los pivotes
  `carrera_categoria_credito`/`carrera_actividad_credito` y el `progreso_actividad` siguen intactos).

### 3.4 Sin nuevas columnas ni migraciones

`TypeORM` corre con `synchronize: true`. No se necesita migration ni cambios de schema.

### 3.5 Edición de actividad: no cambia de categoría

El `PUT /creditos/actividades/:id` existente solo edita `nombre`/`descripcion`/`creditos`
(el DTO no incluye `categoriaCreditoId`). Se mantiene así: evita conflictos con el UNIQUE
`(nombre, categoria)` y no obliga a re-validar la categoría.

## 4. Backend

### 4.1 Entidades — sin cambios

`CategoriaCredito` y `ActividadCredito` no se modifican. Ya existen `activo`, UNIQUE y CHECK.

### 4.2 DTOs nuevos

**`backend/src/modules/creditos/dto/actualizar-categoria-catalogo-credito.dto.ts`**

Para editar el catálogo (no confundir con `ActualizarCategoriaCreditoDto`, que edita el pivote
por carrera con `minimoCreditos`).

```typescript
import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ActualizarCategoriaCatalogoCreditoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;
}
```

### 4.3 `CreditosService` — métodos nuevos

Agregar a `backend/src/modules/creditos/creditos.service.ts` (inyecta `categoriaRepo`,
`actividadRepo` y `dataSource`, este último con `@InjectDataSource()` — patrón ya usado en
`MateriasService`; agregar los imports `InjectDataSource` de `@nestjs/typeorm` y `DataSource` de
`typeorm`):

```typescript
async actualizarCategoriaCatalogo(
  categoriaCreditoId: number,
  dto: ActualizarCategoriaCatalogoCreditoDto,
): Promise<CategoriaCredito> {
  const categoria = await this.categoriaRepo.findOne({
    where: { categoriaCreditoId },
  });
  if (!categoria) throw new NotFoundException('Categoría no encontrada');

  if (dto.nombre !== undefined) categoria.nombre = dto.nombre;
  if (dto.descripcion !== undefined) categoria.descripcion = dto.descripcion;

  try {
    return await this.categoriaRepo.save(categoria);
  } catch (error) {
    if (esErrorDuplicado(error)) {
      throw new BadRequestException('Ya existe una categoría con ese nombre');
    }
    throw error;
  }
}

async eliminarCategoriaCatalogo(categoriaCreditoId: number): Promise<void> {
  const categoria = await this.categoriaRepo.findOne({
    where: { categoriaCreditoId },
  });
  if (!categoria) throw new NotFoundException('Categoría no encontrada');
  if (!categoria.activo)
    throw new BadRequestException('La categoría ya está inactiva');

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    categoria.activo = false;
    await queryRunner.manager.save(categoria);
    await queryRunner.manager
      .getRepository(ActividadCredito)
      .update({ categoria: { categoriaCreditoId } }, { activo: false });
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

async restaurarCategoriaCatalogo(categoriaCreditoId: number): Promise<CategoriaCredito> {
  const categoria = await this.categoriaRepo.findOne({
    where: { categoriaCreditoId },
  });
  if (!categoria) throw new NotFoundException('Categoría no encontrada');
  if (categoria.activo)
    throw new BadRequestException('La categoría ya está activa');
  categoria.activo = true;
  return this.categoriaRepo.save(categoria);
}

async eliminarActividadCatalogo(actividadCreditoId: number): Promise<void> {
  const actividad = await this.actividadRepo.findOne({
    where: { actividadCreditoId },
  });
  if (!actividad) throw new NotFoundException('Actividad no encontrada');
  if (!actividad.activo)
    throw new BadRequestException('La actividad ya está inactiva');
  actividad.activo = false;
  await this.actividadRepo.save(actividad);
}

async restaurarActividadCatalogo(actividadCreditoId: number): Promise<ActividadCredito> {
  const actividad = await this.actividadRepo.findOne({
    where: { actividadCreditoId },
  });
  if (!actividad) throw new NotFoundException('Actividad no encontrada');
  if (actividad.activo)
    throw new BadRequestException('La actividad ya está activa');
  actividad.activo = true;
  await this.actividadRepo.save(actividad);
  return this.buscarActividadCompleta(actividadCreditoId);
}
```

**Alinear `listarActividades`** con `listarCategorias` para poder ver inactivas en el tab de admin:

```typescript
async listarActividades(
  categoriaId?: number,
  search?: string,
  incluirInactivas?: boolean,
): Promise<ActividadCredito[]> {
  const qb = this.actividadRepo
    .createQueryBuilder('a')
    .leftJoinAndSelect('a.categoria', 'categoria')
    .orderBy('a.nombre', 'ASC');

  if (!incluirInactivas) {
    qb.andWhere('a.activo = :activo', { activo: true });
  }
  if (categoriaId) {
    qb.andWhere('categoria.categoriaCreditoId = :categoriaId', { categoriaId });
  }
  if (search) {
    qb.andWhere('a.nombre LIKE :search', { search: `%${search}%` });
  }
  return qb.getMany();
}
```

> Nota: el `CreditosEditor` (por carrera) usa `listarActividades()` para ofrecer el catálogo
> disponible y **ya filtra `.activo` en el frontend**, así que el nuevo filtro backend no lo rompe.

**Filtrar lo inactivo en las respuestas** (nuevo). Modificar `obtenerConfiguracionCarrera` y
`obtenerProgreso` (ambos filtran **siempre**, sin depender de `usuarioId`; el controller de
`GET /carreras/:id/creditos` ya inyecta `req.user.usuarioId` en todos los casos):

```typescript
const categoriasCarrera = (
  await this.carreraCategoriaRepo.find({
    where: { carrera: { carreraId } },
    relations: { categoria: true },
  })
).filter((cc) => cc.categoria.activo !== false);

const actividadesCarrera = (
  await this.carreraActividadRepo.find({
    where: { carrera: { carreraId } },
    relations: {
      actividad: { categoria: true },
      materiasRequeridas: { materia: true },
    },
  })
).filter(
  (ca) =>
    ca.actividad.activo !== false &&
    ca.actividad.categoria.activo !== false,
);
```

> Así las inactivas desaparecen del cálculo de `creditosObtenidos`, `categorias`, `actividades` y de
> los resúmenes del dashboard (que delega en `obtenerProgreso`). El `CreditosEditor` (admin) también
> deja de mostrar las inactivas configuradas — comportamiento aceptado: se gestionan desde los tabs
> del catálogo y reaparecen al restaurar.

**Endurecimiento opcional (consistencia):** en `agregarCategoria` y `agregarActividad` (pivotes por
carrera) validar que el elemento del catálogo esté activo, para que el frontend no sea el único
guardrail:

```typescript
if (!categoria.activo)
  throw new BadRequestException('La categoría está inactiva y no puede agregarse a una carrera');
```

Y en `agregarActividad` (pivote por carrera), validar la actividad **y su categoría** (cargando la
relación `categoria` si hace falta):

```typescript
if (actividad.activo === false || actividad.categoria.activo === false)
  throw new BadRequestException('La actividad está inactiva y no puede agregarse a una carrera');
```

Y en `marcarCompletada`, impedir marcar completada una actividad inactiva (para que el frontend no sea
el único guardrail):

```typescript
if (!actividad.activo)
  throw new BadRequestException('La actividad está inactiva');
```

### 4.4 `CreditosController` — rutas nuevas

Agregar a `backend/src/modules/creditos/creditos.controller.ts` (mismo estilo de las existentes:
`@ApiBearerAuth()`, `@Param` con `ParseIntPipe`):

| Método | Ruta | Body | Service |
|---|---|---|---|
| PUT | `/creditos/categorias/:categoriaCreditoId` | `ActualizarCategoriaCatalogoCreditoDto` | `actualizarCategoriaCatalogo` |
| DELETE | `/creditos/categorias/:categoriaCreditoId` | — | `eliminarCategoriaCatalogo` |
| PATCH | `/creditos/categorias/:categoriaCreditoId/restore` | — | `restaurarCategoriaCatalogo` |
| DELETE | `/creditos/actividades/:actividadCreditoId` | — | `eliminarActividadCatalogo` |
| PATCH | `/creditos/actividades/:actividadCreditoId/restore` | — | `restaurarActividadCatalogo` |

Esquema de ejemplo:

```typescript
@Put(':categoriaCreditoId')
async actualizarCategoriaCatalogo(
  @Param('categoriaCreditoId', ParseIntPipe) categoriaCreditoId: number,
  @Body() dto: ActualizarCategoriaCatalogoCreditoDto,
): Promise<CategoriaCredito> {
  return this.creditosService.actualizarCategoriaCatalogo(categoriaCreditoId, dto);
}

@Delete(':categoriaCreditoId')
async eliminarCategoriaCatalogo(
  @Param('categoriaCreditoId', ParseIntPipe) categoriaCreditoId: number,
): Promise<void> {
  return this.creditosService.eliminarCategoriaCatalogo(categoriaCreditoId);
}
```

> Agregar a los imports de `@nestjs/common`: `Put`, `Delete` y `Patch` (el controller actual ya
> importa `Put`/`Delete`). No hace falta `@HttpCode`: Nest ya responde `200` por defecto en
> PUT/PATCH/DELETE (solo `POST` responde `201`).
> El `GET /creditos/actividades` ya acepta queries; agregar `@Query('incluirInactivas') incluirInactivas?: string` y pasarlo parseado (`incluirInactivas === 'true'`) a `listarActividades`.

### 4.5 Validaciones y errores

| Caso | Resultado |
|---|---|
| No existe la categoría/actividad | `404 NotFoundException` |
| Baja de algo ya inactivo | `400 BadRequestException` ("ya está inactiva") |
| Restauración de algo ya activo | `400 BadRequestException` ("ya está activa") |
| Nombre duplicado al editar (ER_DUP_ENTRY) | `400 BadRequestException` reutilizando `esErrorDuplicado` |

### 4.6 API final (resumen de rutas afectadas)

Catálogo global (`CreditosController`):

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/creditos/categorias?incluirInactivas=` | Listar categorías (inactivas opcionales) |
| POST | `/creditos/categorias` | Crear categoría |
| PUT | `/creditos/categorias/:id` | Editar categoría (nombre/descripción) — **nuevo** |
| DELETE | `/creditos/categorias/:id` | Baja lógica categoría + sus actividades — **nuevo** |
| PATCH | `/creditos/categorias/:id/restore` | Restaurar categoría — **nuevo** |
| GET | `/creditos/actividades?categoriaId=&search=&incluirInactivas=` | Listar actividades (agrega `incluirInactivas`) |
| POST | `/creditos/actividades` | Crear actividad |
| PUT | `/creditos/actividades/:id` | Editar actividad (nombre/descripción/creditos) — existente |
| DELETE | `/creditos/actividades/:id` | Baja lógica actividad — **nuevo** |
| PATCH | `/creditos/actividades/:id/restore` | Restaurar actividad — **nuevo** |

## 5. Frontend

### 5.1 `frontend/src/services/creditos.service.ts` — nuevos métodos

Agregar como **métodos del objeto `creditosService`** (sección "catálogo"), siguiendo el estilo del
archivo (`const response = await api...; return response.data;` y `aplanarActividad` para actividades):

```typescript
async actualizarCategoriaCatalogo(
    categoriaCreditoId: number,
    data: { nombre?: string; descripcion?: string },
): Promise<CategoriaCredito> {
    const response = await api.put(`/creditos/categorias/${categoriaCreditoId}`, data);
    return response.data;
},

async eliminarCategoriaCatalogo(categoriaCreditoId: number): Promise<void> {
    await api.delete(`/creditos/categorias/${categoriaCreditoId}`);
},

async restaurarCategoriaCatalogo(categoriaCreditoId: number): Promise<CategoriaCredito> {
    const response = await api.patch(`/creditos/categorias/${categoriaCreditoId}/restore`);
    return response.data;
},

async eliminarActividadCatalogo(actividadCreditoId: number): Promise<void> {
    await api.delete(`/creditos/actividades/${actividadCreditoId}`);
},

async restaurarActividadCatalogo(actividadCreditoId: number): Promise<ActividadCredito> {
    const response = await api.patch(`/creditos/actividades/${actividadCreditoId}/restore`);
    return aplanarActividad(response.data);
},
```

Actualizar el método `listarActividades` (agregar `incluirInactivas` al query string y mantener
`aplanarActividad`):

```typescript
async listarActividades(
    categoriaId?: number,
    search?: string,
    incluirInactivas?: boolean,
): Promise<ActividadCredito[]> {
    const response = await api.get('/creditos/actividades', {
        params: {
            ...(categoriaId ? { categoriaId } : {}),
            ...(search ? { search } : {}),
            ...(incluirInactivas ? { incluirInactivas } : {}),
        },
    });
    return (response.data ?? []).map(aplanarActividad);
},
```

### 5.2 Hook `useAdminCreditosCatalogo` — `frontend/src/hooks/useAdminCreditosCatalogo.ts`

Catálogo global (no depende de `carreraId`). Sigue el patrón de `useAdminCreditos`:
`useMutation` + `useNotificationStore` + `invalidateQueries`.

Queries:

| Query key | fn |
|---|---|
| `['creditos', 'catalogo', 'categorias']` | `listarCategorias(true)` (incluye inactivas) |
| `['creditos', 'catalogo', 'actividades']` | `listarActividades(undefined, undefined, true)` (incluye inactivas) |

> **Ojo con el cache:** `useAdminCreditos` (por carrera) usa las claves `['creditos','categorias']` /
> `['creditos','actividades']` con `queryFn` **sin** inactivas. React Query cachea por clave (no por
> `queryFn`), así que este hook usa claves propias con el prefijo `['creditos','catalogo', ...]` para
> no chocar y mostrar siempre las inactivas. La invalidación refresca **ambas** claves.

Mutations (todas notifican success/error):

| Mutation | `mutationFn` | Invalidación |
|---|---|---|
| `crearCategoria` | `crearCategoria(data)` | `['creditos','categorias']` |
| `actualizarCategoria` | `actualizarCategoriaCatalogo(id, data)` | `['creditos','categorias']`, `['creditos','carrera']`, `['creditos','progreso']`, `['estadisticas']` |
| `eliminarCategoria` | `eliminarCategoriaCatalogo(id)` | ídem anterior |
| `restaurarCategoria` | `restaurarCategoriaCatalogo(id)` | ídem anterior |
| `crearActividad` | `crearActividad(data)` | `['creditos','actividades']` |
| `actualizarActividad` | `actualizarActividad(id, data)` | `['creditos','actividades']`, `['creditos','carrera']`, `['creditos','progreso']`, `['estadisticas']` |
| `eliminarActividad` | `eliminarActividadCatalogo(id)` | ídem anterior |
| `restaurarActividad` | `restaurarActividadCatalogo(id)` | ídem anterior |

> Invalidar también `['creditos','carrera']`/`['creditos','progreso']`/`['estadisticas']` en las
> mutaciones que cambian el catálogo para que las configs por carrera y el progreso se refresquen.

### 5.3 Componentes nuevos en `frontend/src/components/admin/`

#### `CreditosCatalogoTabs.tsx`

Sub-tabs **Categorías | Actividades** (patrón de `AdminTabs`), persistidos en
`localStorage` bajo `admin-creditos-tab`. Renderiza las dos tablas.

#### `CreditosCatalogoCategoriasTab.tsx`

- Card con header "Categorías de créditos" + botón "Nueva categoría" (abre `CreditoCategoriaModal` en modo crear).
- Búsqueda con debounce (300ms) sobre `nombre`/`descripcion`.
- Lista de filas como cards (`bg-bg-surface-secondary/30 border border-hairline rounded-md`):
  - Nombre + `<Badge variant={activo ? 'success' : 'danger'}>{activo ? 'Activa' : 'Inactiva'}</Badge>` (badge siempre, no solo con filtro).
  - Descripción (si existe, `text-text-muted`).
  - Cantidad de actividades activas/inactivas (contar de `['creditos','actividades']`).
  - Acciones: icono `edit` (abre modal edición), y toggle `delete`/`restore` (igual que `TablaMaterias`).
- Modal de confirmación de baja (`Alert` tipo warning):

> "Se marcará la categoría **{nombre}** como inactiva junto con todas sus actividades. El catálogo
> seguirá conservándose, el progreso de los usuarios **no se borra** y las carreras que ya la usan la
> conservan. Podés restaurarla después desde esta misma lista."

- Botón `variant="danger"` para confirmar.

#### `CreditosCatalogoActividadesTab.tsx`

- Card con header "Actividades de créditos" + botón "Nueva actividad" (abre `CreditoActividadModal` en modo crear).
- Filtros: búsqueda debounce (`nombre`) + `Select` de categoría (todas, incluyendo inactivas).
- Lista de filas:
  - Nombre (sin tachado) + badge `+{creditos} créditos` (`Badge variant="info"`) + `<Badge>` de activo/inactivo.
  - Categoría (chip/`text-text-muted`).
  - Acciones: `edit` (modal), `delete`/`restore` (toggle).
- Modal de confirmación de baja:

> "Se marcará la actividad **{nombre}** como inactiva. El progreso de los usuarios **no se borra** y
> las carreras que ya la usan la conservan. Podés restaurarla después."

#### `CreditoCategoriaModal.tsx` y `CreditoActividadModal.tsx`

Modales reutilizados por crear y editar (prop `modo: 'crear' | 'editar'` + `elemento?`), estilo del
proyecto (estado local `useState`, no RHF):

- Categoría: `nombre` (input), `descripcion` (textarea auto-creciente). Submit llama `crearCategoria`
  o `actualizarCategoria`.
- Actividad: `nombre`, `descripcion`, `creditos` (input numérico `min=1`), `categoriaCreditoId`
  (`Select` de categorías **activas** en modo crear; en modo editar la categoría se muestra fija y
  deshabilitada porque el backend no la permite cambiar). Submit llama `crearActividad` o
  `actualizarActividad`.

### 5.4 Integración en `/admin`

`frontend/src/components/admin/AdminTabs.tsx`:

```typescript
export type TabKey = 'carreras' | 'materias' | 'creditos';

const TABS = [
  { key: 'carreras', label: 'Carreras' },
  { key: 'materias', label: 'Materias' },
  { key: 'creditos', label: 'Créditos' },
];
```

`frontend/src/pages/AdminPage.tsx`: importa `TabKey` (exportado de `AdminTabs`) y agrega:

```tsx
{tab === 'creditos' && (
  <Card className="p-6">
    <CreditosCatalogoTabs />
  </Card>
)}
```

El subtítulo de la página puede ampliarse: "Gestioná el catálogo de carreras, materias, créditos y correlativas."

### 5.5 UX adicional (opcional pero recomendado)

- En `CreditosCatalogoActividadesTab`, agrupar las filas por categoría y mostrar las categorías
  inactivas al final del listado (orden estable).
- Al dar de baja una categoría con actividades en uso, el `Alert` del modal puede listar cuántas
  actividades y cuántas carreras la referencian.

## 6. Casos de borde y reglas

| Escenario | Comportamiento |
|---|---|
| Baja de categoría | `activo=false` en la categoría y en **todas sus actividades** (transacción). Progreso intacto. |
| Restaurar categoría | `activo=true` solo en la categoría; sus actividades se restauran individualmente. |
| Restaurar actividad cuya categoría sigue inactiva | Queda oculta y no cuenta para el usuario hasta que se restaure también su categoría. |
| Categoría inactiva en "Agregar categoría" de una carrera | No aparece (el frontend ya filtra `.activo`; backend puede reforzar con 400). |
| Actividad inactiva en "Agregar actividad" de una carrera | No aparece. |
| Categoría/actividad inactiva ya configurada en una carrera | **Oculta para todos** (usuarios y editor admin) y no suma créditos mientras esté inactiva; los pivotes quedan en la base. Al restaurarla reaparece con su progreso intacto. |
| Marcar completada una actividad inactiva | `400 BadRequestException` ("La actividad está inactiva"). |
| Editar nombre duplicado | `400` "Ya existe una categoría/actividad con ese nombre". |
| `GET /creditos/actividades` sin `incluirInactivas` | Filtra `activo=true` (comportamiento nuevo; antes devolvía todo). |

## 7. Resumen de archivos

### Backend

| Archivo | Cambio |
|---|---|
| `backend/src/modules/creditos/dto/actualizar-categoria-catalogo-credito.dto.ts` | **nuevo** — DTO `{ nombre?, descripcion? }` |
| `backend/src/modules/creditos/creditos.service.ts` | 5 métodos nuevos + `listarActividades(incluirInactivas?)` + filtro `activo` en `obtenerConfiguracionCarrera`/`obtenerProgreso` + validaciones en `agregarCategoria`/`agregarActividad`/`marcarCompletada` + `@InjectDataSource()` |
| `backend/src/modules/creditos/creditos.controller.ts` | 5 rutas nuevas + query `incluirInactivas` en GET actividades |

### Frontend

| Archivo | Cambio |
|---|---|
| `frontend/src/services/creditos.service.ts` | 5 métodos nuevos + firma `listarActividades` |
| `frontend/src/hooks/useAdminCreditosCatalogo.ts` | **nuevo** — queries + 8 mutations |
| `frontend/src/components/admin/CreditosCatalogoTabs.tsx` | **nuevo** — sub-tabs Categorías/Actividades |
| `frontend/src/components/admin/CreditosCatalogoCategoriasTab.tsx` | **nuevo** |
| `frontend/src/components/admin/CreditosCatalogoActividadesTab.tsx` | **nuevo** |
| `frontend/src/components/admin/CreditoCategoriaModal.tsx` | **nuevo** |
| `frontend/src/components/admin/CreditoActividadModal.tsx` | **nuevo** |
| `frontend/src/components/admin/AdminTabs.tsx` | agrega tab `'creditos'` |
| `frontend/src/pages/AdminPage.tsx` | renderiza `CreditosCatalogoTabs` |

### Docs

| Archivo | Cambio |
|---|---|
| `docs/api-endpoints.md` | nuevas rutas del catálogo |
| `docs/frontend/admin-page.md` | sección del tab Créditos |
| `docs/implementaciones/sistema-de-creditos.md` | actualizar estado del catálogo global |

## 8. Verificación

1. Backend: `npm run build` (en `backend/`).
2. Frontend: `npm run lint` y `npm run build` (en `frontend/`).
3. Manual:
   - Crear/editar categoría y actividad desde `/admin` → tab "Créditos".
   - Dar de baja una actividad con progreso → **desaparece para todos** (`/creditos`, dashboard,
     detalle de carrera y `CreditosEditor`) y deja de sumar créditos, pero `progreso_actividad` no se
     borra; los pivotes de la carrera quedan en la base.
   - Dar de baja una categoría → sus actividades quedan inactivas; restaurar categoría no restaura
     actividades; restaurar actividad individual sí (vuelve a contar para el usuario siempre que su
     categoría también esté activa).
   - Verificar que una carrera que no tenía configurada la categoría/actividad ya no la ofrece al agregar.
