# Backend: Guía de Implementación Paso a Paso

Guía cronológica de "Cero a Experto" para construir el backend del sistema de seguimiento universitario. Cada paso cita los archivos de documentación donde reside el código detallado.

---
> ✅ **Estado: IMPLEMENTACIÓN COMPLETA** — Todos los pasos (1–4) han sido ejecutados exitosamente.
> `nest build` compila sin errores.

## Paso 1: Configuración Inicial del Entorno

Todo el backend vive dentro de `backend/`. El frontend va en `frontend/` — ambos separados en la raíz del repositorio.

### ✅ 1.1 Inicializar proyecto con NestJS CLI

```
nest new backend --package-manager npm --strict
```

### ✅ 1.2 Instalar todas las dependencias del stack

```
npm install @nestjs/typeorm typeorm mysql2
npm install @nestjs/swagger swagger-ui-express
npm install class-validator class-transformer
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install bcrypt
npm install -D @types/passport-jwt @types/bcrypt ts-node @types/node
```

### ✅ 1.3 Archivos de configuración base

- `backend/.env` — variables de entorno (DB_HOST, DB_PORT, JWT_SECRET, etc.)
- `backend/.env.example` — template sin secrets
- `backend/src/config/database.config.ts` — TypeORM desde variables de entorno
- `backend/src/config/swagger.config.ts` — DocumentBuilder + addBearerAuth()

### ✅ 1.4 Estructura final de carpetas

```
backend/
├── .env / .env.example
├── nest-cli.json / package.json / tsconfig.json
├── .gitignore
├── scripts/
│   ├── init-db.ts          # Crear base de datos si no existe
│   └── seed.ts             # Ejecutar seeds
└── src/
    ├── main.ts                  # Bootstrap: ValidationPipe + Swagger + CORS + HttpExceptionFilter + JwtAuthGuard global
    ├── app.module.ts            # Módulo raíz (importa TypeOrmModule + todos los módulos)
    ├── common/
    │   ├── filters/http-exception.filter.ts
    │   └── constants/estados-materia.ts
    ├── config/
    │   ├── database.config.ts
    │   └── swagger.config.ts
    ├── modules/
    │   ├── auth/                # AuthModule, AuthController, AuthService, JwtStrategy, JwtAuthGuard
    │   ├── usuarios/            # UsuariosModule, UsuariosController, UsuariosService
    │   ├── carreras/            # CarrerasModule, CarrerasController, CarrerasService
    │   ├── materias/            # MateriasModule, MateriasController, MateriasService
    │   ├── progreso/            # ProgresoModule, ProgresoController, ProgresoService
    │   ├── planificacion/       # PlanificacionModule, PlanificacionController, PlanificacionService
    │   └── estadisticas/        # EstadisticasModule, EstadisticasController, EstadisticasService
    └── database/
        └── seeds/
            ├── 01-estados-materia.ts
            ├── 02-bloques-horarios.ts
            └── run-seeds.ts
```

---

## Paso 2: Orden Estricto de Construcción (Roadmap)

| Orden | Módulo | Estado |
|-------|--------|--------|
| 1 | Base de datos + Entidades | ✅ 11 entidades TypeORM |
| 2 | Auth (JWT + Register/Login) | ✅ AuthModule con JWT + Passport |
| 3 | Usuarios (perfil + carreras) | ✅ UsuariosModule completo |
| 4 | Carreras y Materias + Correlativas | ✅ CarrerasModule + MateriasModule |
| 5 | Progreso y Notas | ✅ ProgresoModule con validación de correlativas |
| 6 | Planificador de Horarios | ✅ PlanificacionModule con detección de conflictos |
| 7 | Estadísticas | ✅ EstadisticasModule con resumen, distribución y evolución |

---

## Paso 3: Guía de Conexión y Citas por Componente

### ✅ 3.1 Base de Datos y Entidades (Roadmap #1)

11 entidades TypeORM creadas en `src/modules/*/entities/`:

| Entidad | Archivo |
|---------|---------|
| `usuario` | `usuarios/entities/usuario.entity.ts` |
| `carrera` | `carreras/entities/carrera.entity.ts` |
| `materia` | `materias/entities/materia.entity.ts` |
| `usuario_carrera` | `carreras/entities/usuario-carrera.entity.ts` |
| `carrera_materia` | `carreras/entities/carrera-materia.entity.ts` |
| `correlativa` | `materias/entities/correlativa.entity.ts` |
| `estado_materia` | `progreso/entities/estado-materia.entity.ts` |
| `progreso_materia` | `progreso/entities/progreso-materia.entity.ts` |
| `periodo_planificacion` | `planificacion/entities/periodo-planificacion.entity.ts` |
| `bloque_horario` | `planificacion/entities/bloque-horario.entity.ts` |
| `materia_planificada` | `planificacion/entities/materia-planificada.entity.ts` |

Seeds creados para poblar `estado_materia` (Pendiente=1, En Proceso=2, Completada=3) y `bloque_horario` (7 bloques de 08:00 a 22:00).

### ✅ 3.2 Módulo Auth / JWT (Roadmap #2)

- `POST /api/auth/register` — 201 con token, 400/409 en errores
- `POST /api/auth/login` — 200 con token, 401 en credenciales inválidas
- `GET /api/auth/perfil` — 200 con datos del usuario (protegido)
- JwtAuthGuard global + @Public() para rutas públicas
- JwtStrategy con Passport
- bcrypt hashing con salt rounds = 12

### ✅ 3.3 Módulo Usuarios (Roadmap #3)

- `GET /api/usuarios/:id` — perfil del usuario
- `PATCH /api/usuarios/:id` — actualizar perfil
- `GET /api/usuarios/:id/carreras` — listar inscripciones
- `POST /api/usuarios/:id/carreras` — inscribir en carrera
- `DELETE /api/usuarios/:id/carreras/:usuarioCarreraId` — desactivar inscripción

### ✅ 3.4 Módulo Carreras y Materias (Roadmap #4)

- `GET /api/carreras` — listar carreras
- `GET /api/carreras/:id/plan-estudios` — plan de estudios con correlativas
- `POST /api/carreras` / `POST /api/carreras/:id/materias` — CRUD
- `GET /api/materias` / `GET /api/materias/:id` — catálogo
- `POST /api/materias` — crear materia
- `POST /api/materias/:id/correlativas` / `DELETE` — asignar/eliminar correlativas

### ✅ 3.5 Módulo Progreso (Roadmap #5)

- `GET /api/progreso?usuarioCarreraId=:id` — progreso completo
- `GET /api/progreso/:id` — progreso individual
- `POST /api/progreso/inicializar` — crear registros Pendiente para el plan
- `PUT /api/progreso/:id` — actualizar estado con validación:
  - Nota (4-10) y tipoAprobacion obligatorios si estado = Completada
  - Validación de correlativas antes de En Proceso o Completada
  - Limpieza de nota/tipo si se cambia a estado distinto

### ✅ 3.6 Módulo Planificación de Horarios (Roadmap #6)

- CRUD de períodos de planificación
- Catálogo de bloques horarios (7 bloques fijos)
- Asignación de materias a bloques con detección de conflictos
- Validación: mismo bloque/día/período no puede tener dos materias

### ✅ 3.7 Módulo Estadísticas (Roadmap #7)

- `GET /api/estadisticas/resumen` — promedio, materias por estado, créditos, cuatrimestres restantes, % progreso
- `GET /api/estadisticas/distribucion-estados` — conteo por estado para gráficos
- `GET /api/estadisticas/evolucion` — promedio histórico por cuatrimestre

---

## Paso 4: Pruebas Locales y Verificación

### ⚠️ Base de datos: MariaDB 11.5

El proyecto usa **MariaDB 11.5** (MySQL-compatible) en puerto `3306`. MySQL 9.6 no es compatible porque su plugin `auth_gssapi_client` rompe la conexión con mysql2.

- `init-db.ts` usa el CLI de MariaDB (`mysql.exe`) para crear la BD, no mysql2.
- `seed.ts` obtiene el `DataSource` vía `app.get(DataSource)` (token clase, no string `'DataSource'`).
- `database.config.ts` usa `DB_PASSWORD=root` como default.

### ✅ 4.1 Scripts automáticos

```bash
cd backend
npm run db:init      # Crea la BD via MariaDB CLI (scripts/init-db.ts)
npm run db:seed      # Ejecuta seeds (estados_materia, bloques_horarios)
npm run db:setup     # db:init + db:seed en secuencia
```

### ✅ 4.2 Compilación

```
npx nest build    # 0 errores
```

### 4.3 Para levantar el servidor

```bash
cd backend
npm run start:dev
```

### 4.4 Swagger

Abrir: `http://localhost:3000/api/docs`

### 4.5 Checklist de verificación

- [x] `npm run start:dev` levanta sin errores de compilación
- [x] Conexión TypeORM → MariaDB 11.5 establecida
- [x] Seeds ejecutados (estado_materia + bloque_horario poblados)
- [x] Swagger carga en `http://localhost:3000/api/docs`
- [x] POST `/api/auth/register` devuelve 201 + token
- [x] POST `/api/auth/login` devuelve 200 + token
- [x] GET `/api/auth/perfil` con token devuelve 200
- [x] GET sin token devuelve 401
- [x] POST `/api/usuarios/:id/carreras` inscribe correctamente
- [x] GET `/api/carreras/:id/plan-estudios` devuelve materias con correlativas
- [x] POST `/api/progreso/inicializar` crea registros pendientes
- [x] PUT `/api/progreso/:id` con estado Completada + nota/tipo funciona (200)
- [x] PUT `/api/progreso/:id` sin resolver correlativas falla (400)
- [x] POST `/api/planificacion/periodos/:id/materias` asigna materia a bloque
- [x] GET `/api/estadisticas/resumen?usuarioCarreraId=1` devuelve todos los indicadores
- [x] Errores de validación devuelven 400 con mensajes descriptivos

*(Verificado: el backend compila con `tsc -b`, arranca con `npm run start` y los endpoints fueron probados end-to-end en esta sesión. Todas las rutas viven bajo el prefijo global `/api`.)*
