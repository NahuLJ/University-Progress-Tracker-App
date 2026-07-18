# Módulo Planificación de Horarios — Especificación Técnica

## Endpoints de la API

### GET /api/planificacion/periodos?usuarioCarreraId=:id

Lista todos los períodos de planificación creados por el usuario para una carrera.

| Código | Descripción |
|---|---|
| 200 | `[{ periodoId, anio, instancia, nombre, materiasPlanificadas: [...] }]` |

### POST /api/planificacion/periodos

Crea un nuevo período de planificación.

**Request Body:**
```json
{
    "usuarioCarreraId": 1,
    "anio": 2026,
    "instancia": "1er Cuatrimestre",
    "nombre": "Variante A"
}
```

| Código | Descripción |
|---|---|
| 201 | Período creado |
| 400 | Error de validación |
| 404 | Inscripción no encontrada |

### DELETE /api/planificacion/periodos/:id

Elimina un período de planificación y todas sus materias asignadas.

| Código | Descripción |
|---|---|
| 200 | Período eliminado |
| 404 | Período no encontrado |

### GET /api/planificacion/bloques

Retorna el catálogo de todos los bloques horarios disponibles (7 bloques de 2 horas).

| Código | Descripción |
|---|---|
| 200 | `[{ bloqueId, horaInicio, horaFin }]` |

### GET /api/planificacion/periodos/:id/materias

Retorna todas las materias planificadas dentro de un período, agrupadas por día y bloque.

| Código | Descripción |
|---|---|
| 200 | `[{ planificacionId, materia: { id, nombre, codigo }, bloque: { id, horaInicio, horaFin }, diaSemana }]` |
| 404 | Período no encontrado |

### POST /api/planificacion/periodos/:id/materias

Asigna una materia a un bloque horario y día específico dentro del período.

**Request Body:**
```json
{
    "materiaId": 5,
    "bloqueId": 2,
    "diaSemana": "Lunes"
}
```

| Código | Descripción |
|---|---|
| 201 | Materia planificada exitosamente |
| 400 | Conflicto de horario (el bloque ya está ocupado en ese día) |
| 404 | Período o materia no encontrada |

### DELETE /api/planificacion/materias/:id

Elimina una materia de la planificación.

| Código | Descripción |
|---|---|
| 200 | Materia removida de la planificación |
| 404 | Planificación no encontrada |

---

## DTOs

### CrearPeriodoDto

```typescript
import { IsInt, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearPeriodoDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    usuarioCarreraId: number;

    @ApiProperty({ example: 2026 })
    @IsInt()
    anio: number;

    @ApiProperty({ enum: ['Verano', '1er Cuatrimestre', '2do Cuatrimestre'] })
    @IsEnum(['Verano', '1er Cuatrimestre', '2do Cuatrimestre'])
    instancia: string;

    @ApiPropertyOptional({ example: 'Variante A' })
    @IsOptional()
    @MaxLength(100)
    nombre?: string;
}
```

### PlanificarMateriaDto

```typescript
import { IsInt, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlanificarMateriaDto {
    @ApiProperty({ example: 5 })
    @IsInt()
    materiaId: number;

    @ApiProperty({ example: 2, description: 'ID del bloque horario (1=08-10, 2=10-12, ..., 7=20-22)' })
    @IsInt()
    bloqueId: number;

    @ApiProperty({ enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] })
    @IsEnum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'])
    diaSemana: string;
}
```

---

## Lógica del Service

### PlanificacionService

```typescript
@Injectable()
export class PlanificacionService {
    constructor(
        @InjectRepository(PeriodoPlanificacion)
        private readonly periodoRepo: Repository<PeriodoPlanificacion>,
        @InjectRepository(MateriaPlanificada)
        private readonly materiaPlanificadaRepo: Repository<MateriaPlanificada>,
        @InjectRepository(BloqueHorario)
        private readonly bloqueRepo: Repository<BloqueHorario>,
        @InjectRepository(UsuarioCarrera)
        private readonly usuarioCarreraRepo: Repository<UsuarioCarrera>,
        @InjectRepository(Materia)
        private readonly materiaRepo: Repository<Materia>,
    ) {}

    async listarPeriodos(usuarioCarreraId: number): Promise<PeriodoPlanificacion[]> {
        return this.periodoRepo.find({
            where: { usuarioCarrera: { usuarioCarreraId } },
            relations: ['materiasPlanificadas', 'materiasPlanificadas.materia', 'materiasPlanificadas.bloque'],
            order: { anio: 'DESC', instancia: 'ASC' },
        });
    }

    async crearPeriodo(dto: CrearPeriodoDto): Promise<PeriodoPlanificacion> {
        const inscripcion = await this.usuarioCarreraRepo.findOne({
            where: { usuarioCarreraId: dto.usuarioCarreraId },
        });
        if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

        const periodo = this.periodoRepo.create({
            usuarioCarrera: { usuarioCarreraId: dto.usuarioCarreraId },
            anio: dto.anio,
            instancia: dto.instancia,
            nombre: dto.nombre || null,
        });
        return this.periodoRepo.save(periodo);
    }

    async eliminarPeriodo(id: number): Promise<void> {
        const periodo = await this.periodoRepo.findOne({
            where: { periodoId: id },
            relations: ['materiasPlanificadas'],
        });
        if (!periodo) throw new NotFoundException('Período no encontrado');

        // Eliminar en cascada las materias planificadas
        await this.materiaPlanificadaRepo.remove(periodo.materiasPlanificadas);
        await this.periodoRepo.remove(periodo);
    }

    async listarBloques(): Promise<BloqueHorario[]> {
        return this.bloqueRepo.find({ order: { horaInicio: 'ASC' } });
    }

    async obtenerMateriasDelPeriodo(periodoId: number): Promise<MateriaPlanificada[]> {
        const periodo = await this.periodoRepo.findOne({ where: { periodoId } });
        if (!periodo) throw new NotFoundException('Período no encontrado');

        return this.materiaPlanificadaRepo.find({
            where: { periodo: { periodoId } },
            relations: ['materia', 'bloque'],
            order: { diaSemana: 'ASC', bloque: { horaInicio: 'ASC' } },
        });
    }

    async planificarMateria(periodoId: number, dto: PlanificarMateriaDto): Promise<MateriaPlanificada> {
        const periodo = await this.periodoRepo.findOne({ where: { periodoId } });
        if (!periodo) throw new NotFoundException('Período no encontrado');

        const materia = await this.materiaRepo.findOne({ where: { materiaId: dto.materiaId } });
        if (!materia) throw new NotFoundException('Materia no encontrada');

        const bloque = await this.bloqueRepo.findOne({ where: { bloqueId: dto.bloqueId } });
        if (!bloque) throw new NotFoundException('Bloque horario no encontrado');

        // Validar que no haya conflicto de horario (mismo período, mismo bloque, mismo día)
        const conflicto = await this.materiaPlanificadaRepo.findOne({
            where: {
                periodo: { periodoId },
                bloque: { bloqueId: dto.bloqueId },
                diaSemana: dto.diaSemana,
            },
        });
        if (conflicto) {
            throw new BadRequestException(
                'El bloque horario ya está ocupado en ese día para este período',
            );
        }

        // Validar que la materia no esté ya planificada en este período
        const yaPlanificada = await this.materiaPlanificadaRepo.findOne({
            where: {
                periodo: { periodoId },
                materia: { materiaId: dto.materiaId },
            },
        });
        if (yaPlanificada) {
            throw new BadRequestException(
                'La materia ya fue planificada en este período',
            );
        }

        const planificacion = this.materiaPlanificadaRepo.create({
            periodo,
            materia,
            bloque,
            diaSemana: dto.diaSemana,
        });
        return this.materiaPlanificadaRepo.save(planificacion);
    }

    async eliminarMateriaPlanificada(id: number): Promise<void> {
        const planificacion = await this.materiaPlanificadaRepo.findOne({ where: { planificacionId: id } });
        if (!planificacion) throw new NotFoundException('Materia planificada no encontrada');
        await this.materiaPlanificadaRepo.remove(planificacion);
    }
}
```

---

## Entidades TypeORM

### PeriodoPlanificacionEntity

```typescript
@Entity('periodo_planificacion')
export class PeriodoPlanificacion {
    @PrimaryGeneratedColumn()
    periodoId: number;

    @ManyToOne(() => UsuarioCarrera, (uc) => uc.periodos)
    @JoinColumn({ name: 'usuario_carrera_id' })
    usuarioCarrera: UsuarioCarrera;

    @Column({ type: 'int' })
    anio: number;

    @Column({ type: 'enum', enum: ['Verano', '1er Cuatrimestre', '2do Cuatrimestre'] })
    instancia: string;

    @Column({ length: 100, nullable: true })
    nombre: string;

    @OneToMany(() => MateriaPlanificada, (mp) => mp.periodo, { cascade: true })
    materiasPlanificadas: MateriaPlanificada[];
}
```

### BloqueHorarioEntity

```typescript
@Entity('bloque_horario')
export class BloqueHorario {
    @PrimaryGeneratedColumn()
    bloqueId: number;

    @Column({ type: 'time' })
    horaInicio: string;

    @Column({ type: 'time' })
    horaFin: string;

    @OneToMany(() => MateriaPlanificada, (mp) => mp.bloque)
    materiasPlanificadas: MateriaPlanificada[];
}
```

### MateriaPlanificadaEntity

```typescript
@Entity('materia_planificada')
@Unique(['periodo', 'bloque', 'diaSemana'])
export class MateriaPlanificada {
    @PrimaryGeneratedColumn()
    planificacionId: number;

    @ManyToOne(() => PeriodoPlanificacion, (pp) => pp.materiasPlanificadas)
    @JoinColumn({ name: 'periodo_id' })
    periodo: PeriodoPlanificacion;

    @ManyToOne(() => Materia)
    @JoinColumn({ name: 'materia_id' })
    materia: Materia;

    @ManyToOne(() => BloqueHorario, (bh) => bh.materiasPlanificadas)
    @JoinColumn({ name: 'bloque_id' })
    bloque: BloqueHorario;

    @Column({ type: 'enum', enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] })
    diaSemana: string;
}
```

---

## Validaciones del Negocio

| Regla | Dónde se aplica |
|---|---|
| No puede haber dos materias en el mismo bloque, día y período | Índice único + validación explícita en el Service |
| Una materia no puede planificarse dos veces en el mismo período | Validación explícita en el Service |
| Solo existen 7 bloques fijos: 08-10, 10-12, 12-14, 14-16, 16-18, 18-20, 20-22 | Catálogo predefinido en base de datos (seed) |
| Los días disponibles son Lunes a Sábado | ENUM en la entidad |
| Un período pertenece siempre a un usuario y una carrera | FK a `usuario_carrera` |
| Un usuario puede tener múltiples planificaciones para el mismo año/instancia | Campo `nombre` opcional para distinguirlas |
