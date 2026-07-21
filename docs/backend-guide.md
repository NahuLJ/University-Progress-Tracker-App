# Backend Guide — Sistema de Seguimiento de Carreras Universitarias


> ✅ **Implementado en `backend/`** — Código completo y compilando sin errores.

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| Node.js | 20 LTS | Entorno de ejecución |
| npm | 10+ | Gestor de paquetes |
| NestJS | 10.x | Framework principal (HTTP, modularización, decoradores) |
| Express | 4.x | Motor HTTP subyacente de NestJS |
| TypeScript | 5.x | Tipado estático |
| TypeORM | 0.3.x | ORM para MySQL |
| MariaDB | 11.5 | Base de datos relacional (MySQL-compatible) |
| class-validator | 0.14.x | Validación declarativa de DTOs |
| class-transformer | 0.5.x | Transformación de objetos en DTOs |
| @nestjs/swagger | 7.x | Documentación OpenAPI / Swagger automática |
| mysql2 | 3.x | Driver nativo de MySQL para TypeORM |

---

## Arquitectura y Estructura de Archivos

### Principios Arquitectónicos

- **Modular**: cada funcionalidad de negocio es un módulo de NestJS independiente.
- **Separación de responsabilidades**: `controller` (HTTP) → `service` (lógica) → `repository` (persistencia vía TypeORM).
- **Validación en los DTOs** con `class-validator`, expuesta globalmente con un `ValidationPipe`.
- **Documentación automática**: decoradores `@ApiTags`, `@ApiOperation`, `@ApiResponse` en cada endpoint.
- **Manejo centralizado de excepciones** con un filtro global `HttpExceptionFilter`.

### Estructura de Archivos

```
backend/
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── .env
├── .env.example
│
└── src/
    ├── main.ts                          # Bootstrap NestJS: setGlobalPrefix('api'), CORS, ValidationPipe global, HttpExceptionFilter, Swagger
    ├── app.module.ts                    # Módulo raíz que importa todos los módulos funcionales
    │
    ├── common/                          # Código compartido entre módulos
    │   ├── filters/
    │   │   └── http-exception.filter.ts # Filtro global de excepciones (formato consistente de error)
    │   ├── pipes/
    │   │   └── validation.pipe.ts       # Configuración del ValidationPipe global
    │   ├── interceptors/
    │   │   └── transform.interceptor.ts # Interceptor para formatear respuestas exitosas
    │   └── constants/
    │       └── estados-materia.ts       # Constantes de estados predefinidos (Pendiente=1, etc.)
    │
    ├── config/
    │   ├── database.config.ts           # Configuración de TypeORM desde variables de entorno
    │   └── swagger.config.ts            # Configuración de Swagger (título, descripción, versión)
    │
    ├── modules/
    │   │
    │   ├── auth/
    │   │   ├── auth.module.ts
    │   │   ├── auth.controller.ts
    │   │   ├── auth.service.ts
    │   │   ├── auth.guard.ts            # Guard de autenticación JWT
    │   │   ├── jwt.strategy.ts          # Estrategia Passport para JWT
    │   │   ├── entities/
    │   │   │   └── usuario.entity.ts
    │   │   ├── dto/
    │   │   │   ├── registrar-usuario.dto.ts
    │   │   │   └── login.dto.ts
    │   │   └── interfaces/
    │   │       └── jwt-payload.interface.ts
    │   │
    │   ├── usuarios/
    │   │   ├── usuarios.module.ts
    │   │   ├── usuarios.controller.ts
    │   │   ├── usuarios.service.ts
    │   │   ├── entities/
    │   │   │   └── usuario.entity.ts
    │   │   └── dto/
    │   │       ├── crear-usuario.dto.ts
    │   │       ├── actualizar-usuario.dto.ts
    │   │       └── usuario-response.dto.ts
    │   │
    │   ├── carreras/
    │   │   ├── carreras.module.ts
    │   │   ├── carreras.controller.ts
    │   │   ├── carreras.service.ts
    │   │   ├── entities/
    │   │   │   ├── carrera.entity.ts
    │   │   │   ├── materia.entity.ts
    │   │   │   ├── usuario-carrera.entity.ts
    │   │   │   └── carrera-materia.entity.ts
    │   │   └── dto/
    │   │       ├── crear-carrera.dto.ts
    │   │       ├── inscribir-usuario.dto.ts
    │   │       └── agregar-materia-plan.dto.ts
    │   │
    │   ├── materias/
    │   │   ├── materias.module.ts
    │   │   ├── materias.controller.ts
    │   │   ├── materias.service.ts
    │   │   ├── entities/
    │   │   │   ├── materia.entity.ts
    │   │   │   ├── carrera-materia.entity.ts
    │   │   │   └── correlativa.entity.ts
    │   │   └── dto/
    │   │       ├── crear-materia.dto.ts
    │   │       └── asignar-correlativa.dto.ts
    │   │
    │   ├── progreso/
    │   │   ├── progreso.module.ts
    │   │   ├── progreso.controller.ts
    │   │   ├── progreso.service.ts
    │   │   ├── entities/
    │   │   │   ├── progreso-materia.entity.ts
    │   │   │   └── estado-materia.entity.ts
    │   │   └── dto/
    │   │       ├── actualizar-progreso.dto.ts
    │   │       └── progreso-response.dto.ts
    │   │
    │   ├── planificacion/
    │   │   ├── planificacion.module.ts
    │   │   ├── planificacion.controller.ts
    │   │   ├── planificacion.service.ts
    │   │   ├── entities/
    │   │   │   ├── periodo-planificacion.entity.ts
    │   │   │   ├── bloque-horario.entity.ts
    │   │   │   └── materia-planificada.entity.ts
    │   │   └── dto/
    │   │       ├── crear-periodo.dto.ts
    │   │       ├── planificar-materia.dto.ts
    │   │       └── periodo-response.dto.ts
    │   │
    │   └── estadisticas/
    │       ├── estadisticas.module.ts
    │       ├── estadisticas.controller.ts
    │       ├── estadisticas.service.ts
    │       └── dto/
    │           ├── resumen-carrera.dto.ts
    │           └── estadisticas-response.dto.ts
    │
    └── database/
        ├── seeds/
        │   ├── 01-estados-materia.ts
        │   ├── 02-bloques-horarios.ts
        │   └── 03-carreras-materias.ts
        └── migrations/
            └── (archivos generados por TypeORM)
```

---

## Detalles Críticos para la Implementación

### 1. Configuración de Relaciones con TypeORM

Las relaciones deben reflejar exactamente el modelo definido en `database-design.md`.

#### Relación Muchos a Muchos — Usuario ↔ Carrera

Tabla pivote `UsuarioCarrera` con dos relaciones `ManyToOne`.

```typescript
// usuario-carrera.entity.ts
@Entity('usuario_carrera')
export class UsuarioCarrera {
    @PrimaryGeneratedColumn()
    usuarioCarreraId: number;

    @ManyToOne(() => Usuario, (usuario) => usuario.usuarioCarreras)
    @JoinColumn({ name: 'usuario_id' })
    usuario: Usuario;

    @ManyToOne(() => Carrera, (carrera) => carrera.usuarioCarreras)
    @JoinColumn({ name: 'carrera_id' })
    carrera: Carrera;

    @Column({ type: 'date' })
    fechaInicio: string;

    @Column({ type: 'date', nullable: true })
    fechaFin: string;

    @Column({ default: true })
    activo: boolean;
}
```

#### Relación Muchos a Muchos — Carrera ↔ Materia (Plan de Estudios)

Tabla pivote `CarreraMateria` con atributos extra (`anio`, `cuatrimestre`, `orden`).

```typescript
// carrera-materia.entity.ts
@Entity('carrera_materia')
export class CarreraMateria {
    @PrimaryGeneratedColumn()
    carreraMateriaId: number;

    @ManyToOne(() => Carrera, (carrera) => carrera.planEstudios)
    @JoinColumn({ name: 'carrera_id' })
    carrera: Carrera;

    @ManyToOne(() => Materia, (materia) => materia.planEstudios)
    @JoinColumn({ name: 'materia_id' })
    materia: Materia;

    @Column({ type: 'int' })
    anio: number;

    @Column({ type: 'int' })
    cuatrimestre: number;

    @Column({ type: 'int' })
    orden: number;
}
```

#### Relación Muchos a Muchos Auto-Referenciada — Correlatividades

Se modela como una entidad independiente `Correlativa` con dos `ManyToOne` hacia `Materia`.

```typescript
// correlativa.entity.ts
@Entity('correlativa')
@Unique(['materia', 'materiaCorrelativa', 'carrera'])
@Index('IDX_correlativa_materia_id', ['materia'])
@Index('IDX_correlativa_materia_correlativa_id', ['materiaCorrelativa'])
export class Correlativa {
    @PrimaryGeneratedColumn()
    correlativaId: number;

    @ManyToOne(() => Materia, (materia) => materia.correlativasRequeridas)
    @JoinColumn({ name: 'materia_id' })
    materia: Materia;                     // Materia que necesita la correlativa

    @ManyToOne(() => Materia, (materia) => materia.esCorrelativaDe)
    @JoinColumn({ name: 'materia_correlativa_id' })
    materiaCorrelativa: Materia;          // Materia que actúa como requisito

    @ManyToOne(() => Carrera, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'carrera_id' })
    carrera?: Carrera;                    // Carrera específica (opcional). null = global
}
```

En la entidad `Materia` se declaran las dos colecciones inversas:

```typescript
// materia.entity.ts
@Entity('materia')
export class Materia {
    @PrimaryGeneratedColumn()
    materiaId: number;

    @Column({ length: 200 })
    nombre: string;

    @Column({ length: 20, unique: true })
    codigo: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ type: 'int' })
    cargaHoraria: number;

    @Column({ type: 'int' })
    creditos: number;

    @OneToMany(() => CarreraMateria, (cm) => cm.materia)
    planEstudios: CarreraMateria[];

    @OneToMany(() => Correlativa, (c) => c.materia)
    correlativasRequeridas: Correlativa[];    // Correlativas que esta materia exige

    @OneToMany(() => Correlativa, (c) => c.materiaCorrelativa)
    esCorrelativaDe: Correlativa[];           // Materias que exigen esta como correlativa
}
```

#### Relación Progreso del Usuario

```typescript
// progreso-materia.entity.ts
@Entity('progreso_materia')
@Unique(['usuarioCarrera', 'materia'])
export class ProgresoMateria {
    @PrimaryGeneratedColumn()
    progresoId: number;

    @ManyToOne(() => UsuarioCarrera, (uc) => uc.progresos)
    @JoinColumn({ name: 'usuario_carrera_id' })
    usuarioCarrera: UsuarioCarrera;

    @ManyToOne(() => Materia)
    @JoinColumn({ name: 'materia_id' })
    materia: Materia;

    @ManyToOne(() => EstadoMateria)
    @JoinColumn({ name: 'estado_id' })
    estado: EstadoMateria;

    @Column({ type: 'int', nullable: true })
    nota: number;

    @Column({ type: 'enum', enum: ['Final', 'Promocion'], nullable: true })
    tipoAprobacion: string;

    @Column({ type: 'date', nullable: true })
    fechaCompletado: string;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    fechaActualizacion: Date;
}
```

### 2. Validación de Datos de Entrada con class-validator

Cada DTO se decora con validadores de `class-validator`. NestJS aplica automáticamente `ValidationPipe` a nivel global.

```typescript
// progreso/dto/actualizar-progreso.dto.ts
import { IsInt, IsEnum, IsOptional, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarProgresoDto {
    @ApiProperty({ enum: ['Pendiente', 'En Proceso', 'Completada'] })
    @IsEnum(['Pendiente', 'En Proceso', 'Completada'])
    estado: string;

    @ApiPropertyOptional({ minimum: 4, maximum: 10, description: 'Obligatorio si estado = Completada' })
    @IsOptional()
    @IsInt()
    @Min(4)
    @Max(10)
    nota?: number;

    @ApiPropertyOptional({ enum: ['Final', 'Promocion'], description: 'Obligatorio si estado = Completada' })
    @IsOptional()
    @IsEnum(['Final', 'Promocion'])
    tipoAprobacion?: string;
}
```

En `main.ts` se configura el `ValidationPipe` global:

```typescript
// main.ts
async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,              // Remueve propiedades no decoradas
        forbidNonWhitelisted: true,   // Lanza error si se envía algo no esperado
        transform: true,              // Transforma tipos (string → number, etc.)
    }));

    // ... Swagger, CORS, etc.
}
```

### 3. Manejo Global de Excepciones

Filtro global que captura toda excepción y devuelve una estructura JSON uniforme.

```typescript
// common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        const body = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: ctx.getRequest().url,
            message: typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as any).message,
            error: exception.name,
        };

        this.logger.error(`${ctx.getRequest().method} ${ctx.getRequest().url} → ${status}`, exception.stack);
        response.status(status).json(body);
    }
}
```

### 4. Documentación Automática con Swagger

Configuración en `main.ts`:

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
    .setTitle('API - Seguimiento de Carreras Universitarias')
    .setDescription('API REST para gestionar carreras, materias, progreso académico y planificación horaria')
    .setVersion('1.0')
    .addBearerAuth()                          // Soporte para JWT
    .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

Cada endpoint se decora individualmente:

```typescript
@ApiTags('Progreso')
@Controller('progreso')
export class ProgresoController {
    @Patch(':id')
    @ApiOperation({ summary: 'Actualiza el estado y nota de una materia' })
    @ApiResponse({ status: 200, description: 'Progreso actualizado correctamente' })
    @ApiResponse({ status: 404, description: 'Progreso no encontrado' })
    async actualizar(@Param('id') id: number, @Body() dto: ActualizarProgresoDto) {
        return this.progresoService.actualizar(id, dto);
    }
}
```

### 5. Módulo de Estadísticas

El servicio de estadísticas utiliza `QueryBuilder` de TypeORM para calcular los indicadores directamente desde la base de datos.

```typescript
// estadisticas/estadisticas.service.ts
async obtenerResumen(usuarioCarreraId: number) {
    const promedio = await this.dataSource
        .createQueryBuilder()
        .select('AVG(pm.nota)', 'promedio')
        .from(ProgresoMateria, 'pm')
        .where('pm.usuarioCarreraId = :id', { id: usuarioCarreraId })
        .andWhere('pm.estadoId = :completada', { completada: 3 })
        .andWhere('pm.nota IS NOT NULL')
        .getRawOne();

    const { pendientes } = await this.dataSource
        .createQueryBuilder()
        .select('COUNT(*)', 'pendientes')
        .from(CarreraMateria, 'cm')
        .leftJoin(ProgresoMateria, 'pm',
            'pm.materiaId = cm.materiaId AND pm.usuarioCarreraId = :id',
            { id: usuarioCarreraId }
        )
        .where('cm.carreraId = :carreraId', { carreraId })
        .andWhere('(pm.estadoId IS NULL OR pm.estadoId != :completada)', { completada: 3 })
        .getRawOne();

    // ...
}
```

### 6. Variables de Entorno (`.env`)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=seguimiento_universitario
JWT_SECRET=super-secret-key
JWT_EXPIRES_IN=7d
```

---

## Comandos de Inicialización

```bash
# Crear el proyecto con Nest CLI
nest new backend --package-manager npm --strict

# Dependencias principales
npm install @nestjs/typeorm typeorm mysql2
npm install @nestjs/swagger swagger-ui-express
npm install class-validator class-transformer
npm install @nestjs/jwt @nestjs/passport passport passport-jwt

# Dependencias de desarrollo
npm install -D @types/multer
```

### 7. Scripts de Inicialización

Definidos en `package.json`:

```bash
npm run db:init      # Crea la BD via MariaDB CLI (init-db.ts)
npm run db:seed      # Ejecuta seeds via NestFactory + DataSource class token
npm run db:setup     # db:init + db:seed en secuencia
```

- `scripts/init-db.ts` usa el CLI de MariaDB (`C:\Program Files\MariaDB 11.5\bin\mysql.exe`) para crear la BD, no mysql2.
- `scripts/seed.ts` usa `app.get(DataSource)` (token clase, no el string `'DataSource'`).

### 8. Pitfalls Conocidos (TypeORM + MariaDB / MySQL)

| Problema | Síntoma | Solución |
|---|---|---|
| `string \| null` sin `type` explícito | `DataTypeNotSupportedError: Data type "Object"` | Agregar `@Column({ type: 'varchar', length: N, nullable: true })` — TypeORM no infiere varchar de `string \| null`. |
| `execSync({ shell: true })` en TS strict | `Type 'boolean' is not assignable to type 'string'` | Usar `{ shell: 'cmd.exe' }` en vez de `{ shell: true }`. |
| `app.get('DataSource')` | `Nest could not find DataSource element` | Usar `app.get(DataSource)` importando la clase `DataSource` de `typeorm`. |
| mysql2 no soporta `auth_gssapi_client` | `Server requests authentication using unknown plugin` | Usar MariaDB en vez de MySQL 9, o configurar `authPlugins` en mysql2. |
