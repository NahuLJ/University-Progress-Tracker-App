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
| `GET` | `/usuarios/:id/carreras` | ✅ Bearer | — | `200`: Carreras[] del usuario |
| `POST` | `/usuarios/:id/carreras` | ✅ Bearer | `InscribirCarreraDto` | `201`: Inscripción creada · `400`: Ya inscripto · `404`: Carrera no encontrada |
| `DELETE` | `/usuarios/:id/carreras/:usuarioCarreraId` | ✅ Bearer | — | `200`: Inscripción desactivada · `404`: No encontrada |

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
| `GET` | `/carreras` | ❌ Público | — | `200`: Carreras[] |
| `GET` | `/carreras/:id` | ❌ Público | — | `200`: Carrera · `404`: No encontrada |
| `GET` | `/carreras/:id/plan-estudios` | ❌ Público | — | `200`: Plan con materias + correlativas · `404`: No encontrada |
| `POST` | `/carreras` | ✅ Bearer | `CrearCarreraDto` | `201`: Creada · `400`: Validación |
| `POST` | `/carreras/:id/materias` | ✅ Bearer | `AgregarMateriaPlanDto` | `201`: Agregada · `400`: Ya existe · `404`: No encontrada |

### DTOs

```typescript
interface CrearCarreraDto {
  nombre: string;            // 3-200
  descripcion?: string;
  duracionAnios: number;     // 1-10, acepta 1 decimal
}

interface AgregarMateriaPlanDto {
  materiaId: number;
  anio: number;              // >= 1
  cuatrimestre: number;      // >= 1
  orden: number;             // >= 1
}
```

---

## Materias — `/materias`

| Método | Ruta | Auth | Body | Respuestas |
|--------|------|------|------|------------|
| `GET` | `/materias` | ❌ Público | — | `200`: Materias[] |
| `GET` | `/materias/:id` | ❌ Público | — | `200`: Materia · `404`: No encontrada |
| `POST` | `/materias` | ✅ Bearer | `CrearMateriaDto` | `201`: Creada · `400`: Validación |
| `POST` | `/materias/:id/correlativas` | ✅ Bearer | `AsignarCorrelativaDto` | `201`: Asignada · `400`: Ya existe / auto-referencial · `404`: No encontrada |
| `DELETE` | `/materias/:id/correlativas/:correlativaId` | ✅ Bearer | — | `200`: Eliminada · `404`: No encontrada |

### DTOs

```typescript
interface CrearMateriaDto {
  nombre: string;           // max 200
  codigo: string;           // max 20, único
  descripcion?: string;
  cargaHoraria: number;     // >= 1
  creditos: number;         // >= 1
}

interface AsignarCorrelativaDto {
  materiaCorrelativaId: number;
}
```

---

## Progreso — `/progreso`

| Método | Ruta | Auth | Query | Body | Respuestas |
|--------|------|------|-------|------|------------|
| `GET` | `/progreso` | ✅ Bearer | `usuarioCarreraId` | — | `200`: Progreso[] |
| `GET` | `/progreso/:id` | ✅ Bearer | — | — | `200`: Progreso · `404`: No encontrado |
| `POST` | `/progreso/inicializar` | ✅ Bearer | — | `{ usuarioCarreraId }` | `201`: Inicializado · `404`: Inscripción no encontrada |
| `PUT` | `/progreso/:id` | ✅ Bearer | — | `ActualizarProgresoDto` | `200`: Actualizado · `400`: Correlativas pendientes o validación · `404`: No encontrado |

### DTOs

```typescript
interface ActualizarProgresoDto {
  estado: 'Pendiente' | 'En Proceso' | 'Completada';
  nota?: number;               // 4-10, obligatorio si estado=Completada
  tipoAprobacion?: 'Final' | 'Promocion'; // obligatorio si estado=Completada
}
```

---

## Planificación — `/planificacion`

| Método | Ruta | Auth | Query | Body | Respuestas |
|--------|------|------|-------|------|------------|
| `GET` | `/planificacion/periodos` | ✅ Bearer | `usuarioCarreraId` | — | `200`: Períodos[] |
| `POST` | `/planificacion/periodos` | ✅ Bearer | — | `CrearPeriodoDto` | `201`: Creado · `404`: Inscripción no encontrada |
| `DELETE` | `/planificacion/periodos/:id` | ✅ Bearer | — | — | `200`: Eliminado · `404`: No encontrado |
| `GET` | `/planificacion/bloques` | ✅ Bearer | — | — | `200`: Bloques[] (7 bloques 08-10 a 20-22) |
| `GET` | `/planificacion/periodos/:id/materias` | ✅ Bearer | — | — | `200`: Materias planificadas · `404`: No encontrado |
| `POST` | `/planificacion/periodos/:id/materias` | ✅ Bearer | — | `PlanificarMateriaDto` | `201`: Planificada · `400`: Conflicto / Correlativas pendientes · `404`: No encontrado |
| `GET` | `/planificacion/periodos/:id/materias-desbloqueables` | ✅ Bearer | — | — | `200`: Materias[] que se desbloquearían · `404`: No encontrado |
| `DELETE` | `/planificacion/materias/:id` | ✅ Bearer | — | — | `200`: Removida · `404`: No encontrada |

### DTOs

```typescript
interface CrearPeriodoDto {
  usuarioCarreraId: number;
  anio: number;
  instancia: 'Verano' | '1er Cuatrimestre' | '2do Cuatrimestre';
  nombre?: string; // max 100, opcional para distinguir variantes
}

interface PlanificarMateriaDto {
  materiaId: number;
  bloqueId: number;    // 1=08-10, 2=10-12, ..., 7=20-22
  diaSemana: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
}
```

---

## Estadísticas — `/estadisticas`

| Método | Ruta | Auth | Query | Respuestas |
|--------|------|------|-------|------------|
| `GET` | `/estadisticas/resumen` | ✅ Bearer | `usuarioCarreraId` | `200`: Resumen (promedio, créditos, cuatrimestres restantes) · `404`: Inscripción no encontrada |
| `GET` | `/estadisticas/distribucion-estados` | ✅ Bearer | `usuarioCarreraId` | `200`: Conteo por estado |
| `GET` | `/estadisticas/evolucion` | ✅ Bearer | `usuarioCarreraId` | `200`: Evolución histórica de promedios |

---

## Resumen

| Módulo | Endpoints |
|--------|-----------|
| `auth/` | 3 |
| `usuarios/` | 5 |
| `carreras/` | 5 |
| `materias/` | 5 |
| `progreso/` | 4 |
| `planificacion/` | 8 |
| `estadisticas/` | 3 |
| **Total** | **33** |

Todas las rutas protegidas usan `Authorization: Bearer <token>`. El token se obtiene de `POST /auth/login`. Los errores siguen el formato `{ message: string, statusCode: number }`.
