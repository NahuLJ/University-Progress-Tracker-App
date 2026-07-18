# Módulo Usuarios — Especificación Técnica


> ✅ **Implementado en `backend/`** — Código completo y compilando sin errores.

## Endpoints de la API

### GET /api/usuarios/:id

Obtiene los datos de un usuario por su ID (requiere autenticación).

| Código | Descripción |
|---|---|
| 200 | Retorna `{ usuarioId, nombre, email, fechaRegistro, activo }` |
| 404 | Usuario no encontrado |

### PATCH /api/usuarios/:id

Actualiza parcialmente los datos del perfil del usuario autenticado. Solo el propio usuario puede modificar su perfil.

**Request Body:**
```json
{
    "nombre": "Juan Carlos Pérez"
}
```

| Código | Descripción |
|---|---|
| 200 | Perfil actualizado exitosamente |
| 400 | Error de validación |
| 403 | No autorizado para modificar este perfil |
| 404 | Usuario no encontrado |

### GET /api/usuarios/:id/carreras

Retorna todas las carreras asociadas al usuario (inscripciones activas e inactivas).

| Código | Descripción |
|---|---|
| 200 | `{ carreras: [{ usuarioCarreraId, carrera: { id, nombre }, fechaInicio, activo }] }` |
| 404 | Usuario no encontrado |

### POST /api/usuarios/:id/carreras

Inscribe al usuario en una nueva carrera.

**Request Body:**
```json
{
    "carreraId": 1,
    "fechaInicio": "2026-03-01"
}
```

| Código | Descripción |
|---|---|
| 201 | Inscripción creada exitosamente |
| 400 | El usuario ya está inscripto en esta carrera |
| 404 | Carrera no encontrada |

### DELETE /api/usuarios/:id/carreras/:usuarioCarreraId

Da de baja (desactiva) la inscripción del usuario en una carrera. No elimina físicamente el registro, solo marca `activo = false`.

| Código | Descripción |
|---|---|
| 200 | Inscripción desactivada |
| 404 | Inscripción no encontrada |

---

## DTOs

### CrearUsuarioDto

```typescript
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CrearUsuarioDto {
    @ApiProperty({ example: 'Juan Pérez' })
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    nombre: string;

    @ApiProperty({ example: 'juan@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '$2b$12$...' })
    @IsString()
    passwordHash: string;
}
```

### ActualizarUsuarioDto

```typescript
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarUsuarioDto {
    @ApiPropertyOptional({ example: 'Juan Carlos Pérez' })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    nombre?: string;
}
```

### InscribirCarreraDto

```typescript
import { IsInt, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InscribirCarreraDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    carreraId: number;

    @ApiProperty({ example: '2026-03-01' })
    @IsDateString()
    fechaInicio: string;
}
```

---

## Lógica del Service

### UsuariosService

```typescript
@Injectable()
export class UsuariosService {
    constructor(
        @InjectRepository(Usuario)
        private readonly usuarioRepo: Repository<Usuario>,
        @InjectRepository(UsuarioCarrera)
        private readonly usuarioCarreraRepo: Repository<UsuarioCarrera>,
        @InjectRepository(Carrera)
        private readonly carreraRepo: Repository<Carrera>,
    ) {}

    async buscarPorEmail(email: string): Promise<Usuario | null> {
        return this.usuarioRepo.findOne({ where: { email } });
    }

    async crear(dto: CrearUsuarioDto): Promise<Usuario> {
        const usuario = this.usuarioRepo.create(dto);
        return this.usuarioRepo.save(usuario);
    }

    async obtenerPerfil(id: number): Promise<Usuario> {
        const usuario = await this.usuarioRepo.findOne({ where: { usuarioId: id } });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        return usuario;
    }

    async actualizarPerfil(id: number, dto: ActualizarUsuarioDto): Promise<Usuario> {
        const usuario = await this.obtenerPerfil(id);
        Object.assign(usuario, dto);
        return this.usuarioRepo.save(usuario);
    }

    async obtenerCarreras(id: number): Promise<UsuarioCarrera[]> {
        return this.usuarioCarreraRepo.find({
            where: { usuario: { usuarioId: id } },
            relations: ['carrera'],
            order: { fechaInicio: 'DESC' },
        });
    }

    async inscribirCarrera(usuarioId: number, dto: InscribirCarreraDto): Promise<UsuarioCarrera> {
        // 1. Verificar que la carrera existe
        const carrera = await this.carreraRepo.findOne({ where: { carreraId: dto.carreraId } });
        if (!carrera) throw new NotFoundException('Carrera no encontrada');

        // 2. Verificar que no exista una inscripción activa duplicada
        const existente = await this.usuarioCarreraRepo.findOne({
            where: {
                usuario: { usuarioId },
                carrera: { carreraId: dto.carreraId },
                activo: true,
            },
        });
        if (existente) throw new BadRequestException('Ya estás inscripto en esta carrera');

        // 3. Crear la inscripción
        const inscripcion = this.usuarioCarreraRepo.create({
            usuario: { usuarioId },
            carrera,
            fechaInicio: dto.fechaInicio,
            activo: true,
        });
        return this.usuarioCarreraRepo.save(inscripcion);
    }

    async desactivarCarrera(usuarioId: number, usuarioCarreraId: number): Promise<void> {
        const inscripcion = await this.usuarioCarreraRepo.findOne({
            where: { usuarioCarreraId, usuario: { usuarioId } },
        });
        if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');
        inscripcion.activo = false;
        await this.usuarioCarreraRepo.save(inscripcion);
    }
}
```

---

## Entidades TypeORM

### UsuarioEntity

```typescript
@Entity('usuario')
export class Usuario {
    @PrimaryGeneratedColumn()
    usuarioId: number;

    @Column({ length: 150 })
    nombre: string;

    @Column({ length: 200, unique: true })
    email: string;

    @Column({ name: 'password_hash', length: 255 })
    passwordHash: string;

    @Column({ name: 'fecha_registro', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    fechaRegistro: Date;

    @Column({ default: true })
    activo: boolean;

    @OneToMany(() => UsuarioCarrera, (uc) => uc.usuario)
    usuarioCarreras: UsuarioCarrera[];
}
```

### UsuarioCarreraEntity

```typescript
@Entity('usuario_carrera')
@Unique(['usuario', 'carrera'])
export class UsuarioCarrera {
    @PrimaryGeneratedColumn()
    usuarioCarreraId: number;

    @ManyToOne(() => Usuario, (u) => u.usuarioCarreras)
    @JoinColumn({ name: 'usuario_id' })
    usuario: Usuario;

    @ManyToOne(() => Carrera, (c) => c.usuarioCarreras)
    @JoinColumn({ name: 'carrera_id' })
    carrera: Carrera;

    @Column({ name: 'fecha_inicio', type: 'date' })
    fechaInicio: string;

    @Column({ name: 'fecha_fin', type: 'date', nullable: true })
    fechaFin: string;

    @Column({ default: true })
    activo: boolean;

    @OneToMany(() => ProgresoMateria, (pm) => pm.usuarioCarrera)
    progresos: ProgresoMateria[];

    @OneToMany(() => PeriodoPlanificacion, (pp) => pp.usuarioCarrera)
    periodos: PeriodoPlanificacion[];
}
```
