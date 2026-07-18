# Módulo Progreso — Especificación Técnica


> ✅ **Implementado en `backend/`** — Código completo y compilando sin errores.

## Endpoints de la API

### GET /api/progreso?usuarioCarreraId=:id

Obtiene el progreso completo del usuario en todas las materias de una carrera específica.

| Código | Descripción |
|---|---|
| 200 | `[{ progresoId, materia: { id, nombre, codigo, creditos }, estado: { id, nombre }, nota, tipoAprobacion, fechaCompletado, fechaActualizacion }]` |

### GET /api/progreso/:id

Obtiene el progreso individual de una materia específica.

| Código | Descripción |
|---|---|
| 200 | `{ progresoId, materiaId, estado, nota, tipoAprobacion, fechaCompletado }` |
| 404 | Progreso no encontrado |

### PUT /api/progreso/:id

Actualiza el estado, nota y/o tipo de aprobación de una materia. Valida correlativas antes de permitir "En Proceso" o "Completada".

**Request Body:**
```json
{
    "estado": "Completada",
    "nota": 8,
    "tipoAprobacion": "Final"
}
```

| Código | Descripción |
|---|---|
| 200 | Progreso actualizado correctamente |
| 400 | Error de validación (nota faltante para "Completada", correlativas no cumplidas, nota fuera de rango 4-10) |
| 404 | Progreso no encontrado |

### POST /api/progreso/inicializar

Inicializa los registros de progreso para todas las materias del plan de estudios de una carrera. Crea registros con estado "Pendiente" para las materías que aún no tienen progreso registrado.

**Request Body:**
```json
{
    "usuarioCarreraId": 1
}
```

| Código | Descripción |
|---|---|
| 201 | Progreso inicializado. Retorna `{ creados: 25, existentes: 3 }` |
| 404 | Inscripción no encontrada |

---

## DTOs

### ActualizarProgresoDto

```typescript
import { IsEnum, IsInt, IsOptional, Min, Max, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarProgresoDto {
    @ApiProperty({ enum: ['Pendiente', 'En Proceso', 'Completada'] })
    @IsEnum(['Pendiente', 'En Proceso', 'Completada'])
    estado: string;

    @ApiPropertyOptional({ description: 'Obligatorio (4-10) cuando estado = Completada' })
    @ValidateIf((o) => o.estado === 'Completada')
    @IsInt()
    @Min(4)
    @Max(10)
    nota?: number;

    @ApiPropertyOptional({ enum: ['Final', 'Promocion'], description: 'Obligatorio cuando estado = Completada' })
    @ValidateIf((o) => o.estado === 'Completada')
    @IsEnum(['Final', 'Promocion'])
    tipoAprobacion?: string;
}
```

### InicializarProgresoDto

```typescript
import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InicializarProgresoDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    usuarioCarreraId: number;
}
```

---

## Lógica del Service

### ProgresoService

```typescript
@Injectable()
export class ProgresoService {
    constructor(
        @InjectRepository(ProgresoMateria)
        private readonly progresoRepo: Repository<ProgresoMateria>,
        @InjectRepository(UsuarioCarrera)
        private readonly usuarioCarreraRepo: Repository<UsuarioCarrera>,
        @InjectRepository(CarreraMateria)
        private readonly carreraMateriaRepo: Repository<CarreraMateria>,
        @InjectRepository(Correlativa)
        private readonly correlativaRepo: Repository<Correlativa>,
        @InjectRepository(EstadoMateria)
        private readonly estadoRepo: Repository<EstadoMateria>,
    ) {}

    async obtenerPorCarrera(usuarioCarreraId: number): Promise<ProgresoMateria[]> {
        return this.progresoRepo.find({
            where: { usuarioCarrera: { usuarioCarreraId } },
            relations: ['materia', 'estado'],
            order: { materia: { nombre: 'ASC' } },
        });
    }

    async obtenerPorId(id: number): Promise<ProgresoMateria> {
        const progreso = await this.progresoRepo.findOne({
            where: { progresoId: id },
            relations: ['materia', 'estado'],
        });
        if (!progreso) throw new NotFoundException('Progreso no encontrado');
        return progreso;
    }

    async inicializar(dto: InicializarProgresoDto): Promise<{ creados: number; existentes: number }> {
        const inscripcion = await this.usuarioCarreraRepo.findOne({
            where: { usuarioCarreraId: dto.usuarioCarreraId },
            relations: ['carrera'],
        });
        if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

        const planCompleto = await this.carreraMateriaRepo.find({
            where: { carrera: { carreraId: inscripcion.carrera.carreraId } },
            relations: ['materia'],
        });

        const estadoPendiente = await this.estadoRepo.findOne({ where: { nombre: 'Pendiente' } });
        let creados = 0;
        let existentes = 0;

        for (const entry of planCompleto) {
            const yaExiste = await this.progresoRepo.findOne({
                where: {
                    usuarioCarrera: { usuarioCarreraId: dto.usuarioCarreraId },
                    materia: { materiaId: entry.materia.materiaId },
                },
            });
            if (yaExiste) {
                existentes++;
                continue;
            }
            const nuevo = this.progresoRepo.create({
                usuarioCarrera: { usuarioCarreraId: dto.usuarioCarreraId },
                materia: { materiaId: entry.materia.materiaId },
                estado: estadoPendiente,
            });
            await this.progresoRepo.save(nuevo);
            creados++;
        }
        return { creados, existentes };
    }

    async actualizar(id: number, dto: ActualizarProgresoDto): Promise<ProgresoMateria> {
        const progreso = await this.progresoRepo.findOne({
            where: { progresoId: id },
            relations: ['materia', 'usuarioCarrera'],
        });
        if (!progreso) throw new NotFoundException('Progreso no encontrado');

        // Buscar el estado por nombre
        const estado = await this.estadoRepo.findOne({ where: { nombre: dto.estado } });

        // Si pasa a "En Proceso" o "Completada", validar correlativas
        if (dto.estado === 'En Proceso' || dto.estado === 'Completada') {
            const correlativasCumplidas = await this.validarCorrelativas(
                progreso.usuarioCarrera.usuarioCarreraId,
                progreso.materia.materiaId,
            );
            if (!correlativasCumplidas) {
                throw new BadRequestException(
                    'No se puede avanzar: existen correlativas pendientes de aprobación',
                );
            }
        }

        progreso.estado = estado;

        if (dto.estado === 'Completada') {
            progreso.nota = dto.nota;
            progreso.tipoAprobacion = dto.tipoAprobacion;
            progreso.fechaCompletado = new Date().toISOString().split('T')[0];
        } else {
            progreso.nota = null;
            progreso.tipoAprobacion = null;
            progreso.fechaCompletado = null;
        }

        return this.progresoRepo.save(progreso);
    }

    private async validarCorrelativas(usuarioCarreraId: number, materiaId: number): Promise<boolean> {
        const correlativas = await this.correlativaRepo.find({
            where: { materia: { materiaId } },
            relations: ['materiaCorrelativa'],
        });

        if (correlativas.length === 0) return true;

        const idsCorrelativas = correlativas.map((c) => c.materiaCorrelativa.materiaId);

        const progresos = await this.progresoRepo.find({
            where: {
                usuarioCarrera: { usuarioCarreraId },
                materia: { materiaId: In(idsCorrelativas) },
            },
            relations: ['estado'],
        });

        const completadas = progresos.filter((p) => p.estado.nombre === 'Completada');
        return completadas.length === correlativas.length;
    }
}
```

---

## Entidad TypeORM

### ProgresoMateriaEntity

```typescript
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

    @Column({ name: 'fecha_completado', type: 'date', nullable: true })
    fechaCompletado: string;

    @Column({ name: 'fecha_actualizacion', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    fechaActualizacion: Date;
}
```

### EstadoMateriaEntity

```typescript
@Entity('estado_materia')
export class EstadoMateria {
    @PrimaryGeneratedColumn()
    estadoId: number;

    @Column({ length: 20, unique: true })
    nombre: string; // 'Pendiente', 'En Proceso', 'Completada'
}
```

---

## Validaciones del Negocio

| Regla | Dónde se aplica |
|---|---|
| La nota es obligatoria solo si el estado es "Completada" | DTO con `@ValidateIf` y en el Service al guardar |
| La nota debe ser un entero entre 4 y 10 | `@Min(4) @Max(10)` en el DTO |
| El tipo de aprobación es obligatorio solo si el estado es "Completada" | DTO con `@ValidateIf` |
| No se puede pasar a "En Proceso" o "Completada" si hay correlativas pendientes | Service → método `validarCorrelativas()` |
| Si se cambia a un estado distinto de "Completada", se limpian nota, tipoAprobacion y fechaCompletado | Service → método `actualizar()` |
