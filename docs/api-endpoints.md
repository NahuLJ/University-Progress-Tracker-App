# API Endpoints — Referencia para Frontend

> Base URL: `http://localhost:3000/api`

## Autenticación — `/auth`

| Método | Ruta | Auth | Body | Respuestas |
|--------|------|------|------|------------|
| `POST` | `/auth/register` | ❌ Público | `RegistrarUsuarioDto` | `201`: Usuario creado · `400`: Validación · `409`: Email ya registrado |
| `POST` | `/auth/login` | ❌ Público | `LoginDto` | `200`: `{ token, usuario }` · `401`: Credenciales inválidas |
| `GET` | `/auth/perfil` | ✅ Bearer | — | `200`: Datos del perfil · `401`: Token inválido |

### DTOs

```typescript
// POST /auth/register
interface RegistrarUsuarioDto {
  nombre: string;           // 2-150 chars
  email: string;            // email válido
  password: string;         // 8-50, mayúscula+minúscula+dígito+especial
  confirmarPassword: string; // debe coincidir con password
}

// POST /auth/login
interface LoginDto {
  email: string;
  password: string;
}
```

---

## Usuarios — `/usuarios`

| Método | Ruta | Auth | Body | Respuestas |
|--------|------|------|------|------------|
| `GET` | `/usuarios/:id` | ✅ Bearer | — | `200`: Usuario · `404`: No encontrado |
| `PATCH` | `/usuarios/:id` | ✅ Bearer | `ActualizarUsuarioDto` | `200`: Actualizado · `404`: No encontrado |
| `GET` | `/usuarios/:id/carreras` | ✅ Bearer | `?page=N&limit=N` | `200`: `{ data: Carreras[], total, page, limit, totalPages }` |
| `GET` | `/usuarios/:id/carreras-activas` | ✅ Bearer | `?page=N&limit=N` | `200`: `{ data: Carreras activas[], total, page, limit, totalPages }` |
| `GET` | `/usuarios/:id/carreras-inactivas` | ✅ Bearer | `?page=N&limit=N` | `200`: `{ data: Carreras inactivas[], total, page, limit, totalPages }` |
| `POST` | `/usuarios/:id/carreras` | ✅ Bearer | `InscribirCarreraDto` | `201`: Inscripción creada · `400`: Ya inscripto · `404`: Carrera no encontrada |
| `DELETE` | `/usuarios/:id/carreras/:usuarioCarreraId` | ✅ Bearer | — | `200`: Inscripción desactivada · `404`: No encontrada |
| `PATCH` | `/usuarios/:id/carreras/:usuarioCarreraId/reactivar` | ✅ Bearer | — | `200`: Inscripción reactivada · `400`: Ya activa · `404`: No encontrada |
| `DELETE` | `/usuarios/:id/carreras/:usuarioCarreraId/definitivo` | ✅ Bearer | — | `200`: Inscripción eliminada · `404`: No encontrada |

> **Nota de eliminación definitiva:** La eliminación (`DELETE /.../:usuarioCarreraId/definitivo`)
> borra la inscripción y, por cascada de FK, sus planificaciones y trayectorias. El **progreso se
> conserva siempre**: como `progreso_materia` pertenece al `usuario` (progreso compartido entre
> carreras), no se elimina al borrar una inscripción. El soft delete
> (`DELETE /.../:usuarioCarreraId`, sin `/definitivo`) tampoco borra ningún progreso.

### DTOs

```typescript
interface ActualizarUsuarioDto {
  nombre?: string; // 2-150
}

interface InscribirCarreraDto {
  carreraId: number;
  fechaInicio: string; // ISO date "YYYY-MM-DD"
}
```

---

## Carreras — `/carreras`

| Método | Ruta | Auth | Body | Respuestas |
|--------|------|------|------|------------|
| `GET` | `/carreras` | ❌ Público (sin params) / ✅ Bearer (con params) | `?search=&sortBy=&sortOrder=&incluirInactivos=&page=&limit=` | Sin params: `200`: `Carrera[]` (solo activas). Con params: `200`: `{ data: CarreraAdminRow[], total, page, limit, totalPages }` donde cada item incluye `totalMaterias: number` |
| `GET` | `/carreras/disponibles/:usuarioId` | ❌ Público | `?page=N&limit=N` | `200`: `{ data: Carreras[], total, page, limit, totalPages }` |
| `GET` | `/carreras/:id` | ❌ Público | — | `200`: Carrera · `404`: No encontrada / inactiva |
| `GET` | `/carreras/:id/plan-estudios` | ✅ Bearer | — | `200`: Plan con materias + correlativas + `estadoUsuario`/`nota`/`tipoAprobacion` del usuario autenticado (progreso compartido, se muestra aunque no esté inscripto) · `404`: No encontrada |
| `POST` | `/carreras` | ✅ Bearer | `CrearCarreraDto` | `201`: Creada · `400`: Validación / nombre duplicado |
| `PUT` | `/carreras/:id` | ✅ Bearer | `ActualizarCarreraDto` | `200`: Actualizada · `400`: Validación · `404`: No encontrada |
| `DELETE` | `/carreras/:id` | ✅ Bearer | — | `200`: Desactivada (baja lógica, `activo = false`) · `404`: No encontrada |
| `PATCH` | `/carreras/:id/restore` | ✅ Bearer | — | `200`: Restaurada (`activo = true`) · `404`: No encontrada |
| `POST` | `/carreras/:id/materias` | ✅ Bearer | `AgregarMateriaPlanDto` | `201`: Agregada · `400`: Ya existe / duplicado orden / correlativas en periodos no anteriores · `404`: No encontrada |
| `PUT` | `/carreras/:id/materias/:carreraMateriaId` | ✅ Bearer | `ActualizarMateriaPlanDto` | `200`: Actualizada · `400`: Al menos un campo / duplicado orden / correlativas no anteriores · `404`: No encontrada |
| `DELETE` | `/carreras/:id/materias/:carreraMateriaId` | ✅ Bearer | — | `200`: Quitada (baja física con cascada) · `404`: No encontrada |

### DTOs

```typescript
interface CrearCarreraDto {
  nombre: string;            // 3-200
  descripcion?: string;
  duracionAnios: number;     // 1-10, 1 decimal, múltiplo de 0.5
}

interface ActualizarCarreraDto {
  nombre?: string;           // 3-200
  descripcion?: string;
  duracionAnios?: number;    // 1-10, 1 decimal, múltiplo de 0.5
}

interface AgregarMateriaPlanDto {
  materiaId: number;
  anio: number;              // >= 1
  cuatrimestre: number;      // 1-2
  orden: number;             // >= 1
}

interface ActualizarMateriaPlanDto {
  anio?: number;             // >= 1 (opcional, al menos un campo requerido)
  cuatrimestre?: number;     // 1-2
  orden?: number;            // >= 1
}
```

---

## Materias — `/materias`

| Método | Ruta | Auth | Body | Respuestas |
|--------|------|------|------|------------|
| `GET` | `/materias` | ❌ Público (sin params) / ✅ Bearer (con params) | `?search=&sortBy=&sortOrder=&incluirInactivos=&page=&limit=` | Sin params: `200`: `Materia[]` (solo activas). Con params: `200`: `{ data: MateriaAdminRow[], total, page, limit, totalPages }` donde cada item incluye `totalCarreras: number` |
| `GET` | `/materias/:id` | ❌ Público | `?carreraId=N` (opcional) | `200`: MateriaDetalle (incluye `correlativas[]`, `carreras[]`) · `404`: No encontrada / inactiva |
| `POST` | `/materias` | ✅ Bearer | `CrearMateriaDto` | `201`: Creada · `400`: Validación / código o nombre duplicado |
| `PUT` | `/materias/:id` | ✅ Bearer | `ActualizarMateriaDto` | `200`: Actualizada · `400`: Validación · `404`: No encontrada |
| `DELETE` | `/materias/:id` | ✅ Bearer | — | `200`: Desactivada con purge (baja lógica + DELETE en cascada) · `404`: No encontrada |
| `PATCH` | `/materias/:id/restore` | ✅ Bearer | — | `200`: Restaurada (`activo = true`) · `404`: No encontrada |
| `POST` | `/materias/:id/correlativas` | ✅ Bearer | `AsignarCorrelativaDto` (incluye `carreraId` opcional) | `201`: Asignada · `400`: Ya existe / auto-referencial / orden inválido · `404`: No encontrada |
| `DELETE` | `/materias/:id/correlativas/:correlativaId` | ✅ Bearer | `?carreraId=N` (opcional, ignorado por backend) | `200`: Eliminada · `404`: No encontrada |

### DTOs

```typescript
interface CrearMateriaDto {
  nombre: string;           // max 200
  codigo: string;           // max 20, único
  descripcion?: string;
  cargaHoraria: number;     // >= 1
  creditos: number;         // >= 1
}

interface ActualizarMateriaDto {
  nombre?: string;          // max 200
  codigo?: string;          // max 20
  descripcion?: string;
  cargaHoraria?: number;    // >= 1
  creditos?: number;        // >= 1
}

interface AsignarCorrelativaDto {
  materiaCorrelativaId: number;
  carreraId?: number; // opcional — si se provee, la correlativa aplica solo a esa carrera
}
```

---

## Progreso — `/progreso`

| Método | Ruta | Auth | Query | Body | Respuestas |
|--------|------|------|-------|------|------------|
| `GET` | `/progreso` | ✅ Bearer | `usuarioCarreraId` | — | `200`: Progreso[] (incluye `anio`, `cuatrimestre`, `orden` del plan) |
| `GET` | `/progreso/:id` | ✅ Bearer | — | — | `200`: Progreso · `404`: No encontrado |
| `POST` | `/progreso/inicializar` | ✅ Bearer | — | `{ usuarioCarreraId }` | `201`: Inicializado · `404`: Inscripción no encontrada |
| `PATCH` | `/progreso/:id` | ✅ Bearer | — | `ActualizarProgresoDto` | `200`: Actualizado · `400`: Correlativas pendientes o validación · `404`: No encontrado |

### DTOs

```typescript
interface ActualizarProgresoDto {
  estado: 'Pendiente' | 'En Proceso' | 'Completada';
  nota?: number;               // 4-10, obligatorio si estado=Completada
  tipoAprobacion?: 'Final' | 'Promocion'; // obligatorio si estado=Completada
  carreraId: number;           // obligatorio: identifica la carrera desde la que se actualiza (el progreso es compartido entre carreras del usuario)
}
```

---

## Planificación — `/planificacion`

| Método | Ruta | Auth | Query | Body | Respuestas |
|--------|------|------|-------|------|------------|
| `GET` | `/planificacion/periodos` | ✅ Bearer | `usuarioCarreraId`, `independientes` (bool) | — | `200`: Períodos[] (con `independientes=true` solo sin `trayectoriaId`) |
| `GET` | `/planificacion/periodos-paginado` | ✅ Bearer | `usuarioCarreraId`, `page`, `limit`, `independientes` (bool) | — | `200`: `{ data: [...], total, page, limit, totalPages }` |
| `POST` | `/planificacion/periodos` | ✅ Bearer | — | `CrearPeriodoDto` | `201`: Creado · `400`: Orden cronológico / origen inválido · `404`: Inscripción/trayectoria no encontrada |
| `PATCH` | `/planificacion/periodos/:id` | ✅ Bearer | — | `ActualizarPeriodoDto` | `200`: Actualizado · `400`: Validación · `404`: No encontrado |
| `DELETE` | `/planificacion/periodos/:id` | ✅ Bearer | — | — | `200`: Eliminado (cascade a hijos por FK) · `404`: No encontrado |
| `GET` | `/planificacion/bloques` | ✅ Bearer | — | — | `200`: Bloques[] (7 bloques 08-10 a 20-22) |
| `GET` | `/planificacion/periodos/:id/materias` | ✅ Bearer | — | — | `200`: Materias planificadas[] (vacío si no existe el período) |
| `POST` | `/planificacion/periodos/:id/materias` | ✅ Bearer | — | `PlanificarMateriaDto` | `201`: Planificada · `400`: Conflicto / Correlativas pendientes · `404`: No encontrado |
| `GET` | `/planificacion/disponibles` | ✅ Bearer | `usuarioCarreraId`, `trayectoriaId` (opcional), `periodoId` (opcional) | — | `200`: Materias disponibles[] (incluye desbloqueadas por planificaciones previas y excluye las ya ubicadas en la misma cadena de la trayectoria) |
| `GET` | `/planificacion/periodos/:id/materias-desbloqueables` | ✅ Bearer | `materiaIds` (comma-separated IDs) | — | `200`: Materias[] que se desbloquearían con la planificación actual (al menos una correlativa planificada en el período; vacío si no existe el período) |
| `DELETE` | `/planificacion/materias/:id` | ✅ Bearer | `modo`: `simple` \| `cascade` | Opcional. `simple` (default): elimina solo esa materia. `cascade`: elimina todos los bloques + dependientes en hijos | `200`: Removida · `404`: No encontrada |

### DTOs

```typescript
interface CrearPeriodoDto {
  usuarioCarreraId: number;
  anio: number;
  instancia: 'Verano' | '1er Cuatrimestre' | '2do Cuatrimestre';
  nombre?: string;            // max 100, opcional para distinguir variantes
  trayectoriaId?: number;     // si se especifica, pertenece a una trayectoria
  planificacionOrigenId?: number; // planificación anterior en la cadena (fork)
}

interface PlanificarMateriaDto {
  materiaId: number;
  bloqueId: number;    // 1=08-10, 2=10-12, ..., 7=20-22
  diaSemana: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
}
```

---

## Trayectorias — `/trayectorias`

| Método | Ruta | Auth | Query | Body | Respuestas |
|--------|------|------|-------|------|------------|
| `GET` | `/trayectorias` | ✅ Bearer | `usuarioCarreraId` | — | `200`: Trayectorias[] (incluye `planificaciones` con count) |
| `POST` | `/trayectorias` | ✅ Bearer | — | `CrearTrayectoriaDto` | `201`: Creada · `400`: Ya existe (unique nombre por carrera) |
| `PATCH` | `/trayectorias/:id` | ✅ Bearer | — | `ActualizarTrayectoriaDto` | `200`: Actualizada · `404`: No encontrada |
| `DELETE` | `/trayectorias/:id` | ✅ Bearer | — | — | `200`: Eliminada + cascade a planificaciones |
| `GET` | `/trayectorias/:id/planificaciones` | ✅ Bearer | — | — | `200`: PeriodoPlanificacion[] ordenadas por anio, instancia |
| `GET` | `/trayectorias/:id/arbol` | ✅ Bearer | — | — | `200`: `{ periodo, hijos: [...] }` árbol de bifurcaciones |

### DTOs

```typescript
interface CrearTrayectoriaDto {
  usuarioCarreraId: number;
  nombre: string;            // max 150
}

interface ActualizarTrayectoriaDto {
  nombre?: string;           // max 150
}
```

---

## Administración (Catálogo) — `/carreras` y `/materias`

> Solo admin. Los endpoints de escritura del backend usan `@ApiBearerAuth()` (pendiente de
> agregar guard de roles `@Roles('admin')`). Ver `docs/backend/admin-carreras-materias-module.md`.

| Método | Ruta | Auth | Body | Respuestas |
|--------|------|------|------|------------|
| `GET` | `/carreras` | ✅ Bearer | `?search=&sortBy=&sortOrder=&incluirInactivos=&page=&limit=` | `200`: `{ data: CarreraAdminRow[], total, page, limit, totalPages }` |
| `POST` | `/carreras` | ✅ Bearer | `CrearCarreraDto` | `201`: Carrera creada · `400`: Validación / nombre duplicado |
| `PUT` | `/carreras/:id` | ✅ Bearer | `ActualizarCarreraDto` | `200`: Actualizada · `400`: Validación · `404`: No encontrada |
| `DELETE` | `/carreras/:id` | ✅ Bearer | — | `200`: Desactivada (baja lógica) · `404`: No encontrada |
| `PATCH` | `/carreras/:id/restore` | ✅ Bearer | — | `200`: Restaurada · `404`: No encontrada |
| `POST` | `/carreras/:id/materias` | ✅ Bearer | `AgregarMateriaPlanDto` | `201`: Agregada · `400`: Ya existe / duplicado orden · `404`: No encontrada |
| `PUT` | `/carreras/:id/materias/:carreraMateriaId` | ✅ Bearer | `ActualizarMateriaPlanDto` | `200`: Actualizada · `400`: Al menos un campo / duplicado orden / correlativas no anteriores · `404`: No encontrada |
| `DELETE` | `/carreras/:id/materias/:carreraMateriaId` | ✅ Bearer | — | `200`: Quitada (baja física en cascada) · `404`: No encontrada |
| `GET` | `/materias` | ✅ Bearer | `?search=&sortBy=&sortOrder=&incluirInactivos=&page=&limit=` | `200`: `{ data: MateriaAdminRow[], total, page, limit, totalPages }` |
| `POST` | `/materias` | ✅ Bearer | `CrearMateriaDto` | `201`: Creada · `400`: Código o nombre duplicado |
| `PUT` | `/materias/:id` | ✅ Bearer | `ActualizarMateriaDto` | `200`: Actualizada · `400`: Validación · `404`: No encontrada |
| `DELETE` | `/materias/:id` | ✅ Bearer | — | `200`: Desactivada con purge · `404`: No encontrada |
| `PATCH` | `/materias/:id/restore` | ✅ Bearer | — | `200`: Restaurada · `404`: No encontrada |
| `POST` | `/materias/:id/correlativas` | ✅ Bearer | `{ materiaCorrelativaId, carreraId? }` | `201`: Asignada · `400`: Auto-ref / duplicada · `404`: No encontrada |
| `DELETE` | `/materias/:id/correlativas/:correlativaId` | ✅ Bearer | `?carreraId=N` | `200`: Eliminada · `404`: No encontrada |

### DTOs

```typescript
interface CarreraAdminRow {
  carreraId: number;
  nombre: string;
  descripcion: string | null;
  duracionAnios: number;
  activo: boolean;
  totalMaterias: number;
}

interface MateriaAdminRow {
  materiaId: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  cargaHoraria: number;
  creditos: number;
  activo: boolean;
  totalCarreras: number;
}
```

---

## Créditos por actividades — `/creditos` y `/carreras/:id/creditos*`

> Catálogo global (categorías/actividades) + configuración por carrera + progreso del usuario. Los requisitos de materias de una actividad son **por carrera** (`PUT .../requisitos`); el catálogo global no los maneja. Sin `RolesGuard` aún (mismo criterio que el resto del módulo admin). Ver `docs/implementaciones/sistema-de-creditos.md`.

### Catálogo y progreso — `/creditos`

| Método | Ruta | Auth | Query / Body | Respuestas |
|--------|------|------|--------------|------------|
| `GET` | `/creditos/categorias` | ✅ Bearer | `?incluirInactivas` | `200`: `CategoriaCredito[]` |
| `POST` | `/creditos/categorias` | ✅ Bearer | `{ nombre, descripcion? }` | `201`: Creada · `400`: Nombre duplicado |
| `PUT` | `/creditos/categorias/:categoriaCreditoId` | ✅ Bearer | `{ nombre?, descripcion? }` | `200`: Actualizada · `400`: Nombre duplicado · `404`: No encontrada |
| `DELETE` | `/creditos/categorias/:categoriaCreditoId` | ✅ Bearer | — | `200`: Desactivada (junto con sus actividades) · `400`: Ya inactiva · `404`: No encontrada |
| `PATCH` | `/creditos/categorias/:categoriaCreditoId/restore` | ✅ Bearer | — | `200`: Restaurada · `400`: Ya activa · `404`: No encontrada |
| `GET` | `/creditos/actividades` | ✅ Bearer | `?categoriaId&search&incluirInactivas` (sin `incluirInactivas` filtra `activo=true`) | `200`: `ActividadCredito[]` (con `categoria` anidada) |
| `POST` | `/creditos/actividades` | ✅ Bearer | `{ nombre, descripcion?, categoriaCreditoId, creditos }` | `201`: Creada · `400`: Validación / duplicada en la categoría / categoría inactiva |
| `PUT` | `/creditos/actividades/:actividadCreditoId` | ✅ Bearer | `{ nombre?, descripcion?, creditos? }` | `200`: Actualizada · `404`: No encontrada |
| `DELETE` | `/creditos/actividades/:actividadCreditoId` | ✅ Bearer | — | `200`: Desactivada · `400`: Ya inactiva · `404`: No encontrada |
| `PATCH` | `/creditos/actividades/:actividadCreditoId/restore` | ✅ Bearer | — | `200`: Restaurada · `400`: Ya activa · `404`: No encontrada |
| `GET` | `/creditos/progreso` | ✅ Bearer | `?usuarioCarreraId` | `200`: `CreditosProgreso` · `404`: Inscripción no encontrada |
| `POST` | `/creditos/progreso` | ✅ Bearer | `{ usuarioCarreraId, actividadCreditoId }` | `201`: Completada · `400`: Faltan requisitos aprobados / actividad inactiva · `404`: No encontrada |
| `DELETE` | `/creditos/progreso/:progresoActividadId` | ✅ Bearer | — | `200`: Desmarcada · `404`: No encontrada |

### Configuración de carrera — `/carreras/:id/creditos`

| Método | Ruta | Auth | Query / Body | Respuestas |
|--------|------|------|--------------|------------|
| `GET` | `/carreras/:id/creditos` | ✅ Bearer | — | `200`: `CarreraCreditosConfig` (con progreso del usuario autenticado, se muestra aunque no esté inscripto) |
| `PUT` | `/carreras/:id/creditos` | ✅ Bearer | `{ creditosHabilitado, totalCreditos? }` | `200`: Actualizado · `400`: `sum(minimos) > total` |
| `POST` | `/carreras/:id/creditos/categorias` | ✅ Bearer | `{ categoriaCreditoId, minimoCreditos }` | `201`: Agregada · `400`: Suma de mínimos > total / duplicada |
| `PUT` | `/carreras/:id/creditos/categorias/:carreraCategoriaCreditoId` | ✅ Bearer | `{ minimoCreditos }` | `200`: Actualizada · `400`: Suma de mínimos > total · `404`: No encontrada |
| `DELETE` | `/carreras/:id/creditos/categorias/:carreraCategoriaCreditoId` | ✅ Bearer | — | `200`: Quitada (y sus actividades) · `404`: No encontrada |
| `POST` | `/carreras/:id/creditos/actividades` | ✅ Bearer | `{ actividadCreditoId, materiasRequeridas?: number[] }` | `201`: Agregada · `400`: Categoría no incluida en la carrera / materias inválidas · `404`: No encontrada |
| `PUT` | `/carreras/:id/creditos/actividades/:carreraActividadCreditoId/requisitos` | ✅ Bearer | `{ materiasRequeridas: number[] }` (replace) | `200`: Requisitos actualizados · `400`: Materias inválidas · `404`: No encontrada |
| `DELETE` | `/carreras/:id/creditos/actividades/:carreraActividadCreditoId` | ✅ Bearer | — | `200`: Quitada · `404`: No encontrada |

---

## Estadísticas — `/estadisticas`

| Método | Ruta | Auth | Query | Respuestas |
|--------|------|------|-------|------------|
| `GET` | `/estadisticas/resumen` | ✅ Bearer | `usuarioCarreraId` | `200`: Resumen (promedio, créditos, cuatrimestres restantes, materiasDisponibles) · `404`: Inscripción no encontrada |
| `GET` | `/estadisticas/distribucion-estados` | ✅ Bearer | `usuarioCarreraId` | `200`: Conteo por estado |
| `GET` | `/estadisticas/evolucion` | ✅ Bearer | `usuarioCarreraId` | `200`: Evolución histórica de promedios |
| `GET` | `/estadisticas/notas-distribucion` | ✅ Bearer | `usuarioCarreraId` | `200`: Rangos de nota y conteos (`NotasDistribucion`) · `404`: Inscripción no encontrada |
| `GET` | `/estadisticas/progreso-por-anio` | ✅ Bearer | `usuarioCarreraId` | `200`: Materias por año (completadas, en proceso, pendientes) · `404`: Inscripción no encontrada |
| `GET` | `/estadisticas/carreras-resumen` | ✅ Bearer | `usuarioId` | `200`: CarreraResumen[] (progreso por carrera del usuario) |
| `GET` | `/estadisticas/creditos-progreso` | ✅ Bearer | `usuarioCarreraId` | `200`: `CreditosProgreso` · `404`: Inscripción no encontrada |

---

## Resumen

> Los endpoints de escritura de la sección "Administración (Catálogo)" ya están incluidos en las tablas
> de `carreras/` y `materias/` (son las mismas rutas `POST`). El conteo de abajo suma rutas únicas.

| Módulo | Endpoints |
|--------|-----------|
| `auth/` | 3 |
| `usuarios/` | 8 |
| `carreras/` | 11 |
| `materias/` | 9 |
| `progreso/` | 4 |
| `planificacion/` | 11 |
| `trayectorias/` | 6 |
| `creditos/` | 16 |
| `estadisticas/` | 7 |
| **Total únicos** | **75** |

Todas las rutas protegidas usan `Authorization: Bearer <token>`. El token se obtiene de `POST /auth/login`. Los errores siguen el formato `{ message: string, statusCode: number }`.
