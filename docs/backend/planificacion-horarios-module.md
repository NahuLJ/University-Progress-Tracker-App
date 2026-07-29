# Módulo Planificación de Horarios — Especificación Técnica


> ✅ **Implementado en `backend/`** — Código completo y compilando sin errores.

## Endpoints de la API

### GET /api/planificacion/periodos?usuarioCarreraId=:id&independientes=:bool

Lista todos los períodos de planificación creados por el usuario para una carrera.
Parámetro opcional `independientes=true` filtra solo períodos sin `trayectoriaId` (usando `IsNull()` de TypeORM).

| Código | Descripción |
|---|---|
| 200 | `[{ periodoId, anio, instancia, nombre, trayectoriaId, planificacionOrigenId, trayectoria, planificacionOrigen, materiasPlanificadas: [...] }]` |

### GET /api/planificacion/periodos-paginado?usuarioCarreraId=:id&page=:p&limit=:l&independientes=:bool

Versión paginada de `listarPeriodos`. Parámetro opcional `independientes=true` filtra solo períodos sin trayectoria.

| Código | Descripción |
|---|---|
| 200 | `{ data: [...], total, page, limit, totalPages }` |

### POST /api/planificacion/periodos

Crea un nuevo período de planificación. Si `trayectoriaId` está presente valida orden cronológico; si además `planificacionOrigenId` está presente, la validación solo verifica que el nuevo período sea posterior al origen (fork).

**Request Body:**
```json
{
    "usuarioCarreraId": 1,
    "anio": 2026,
    "instancia": "1er Cuatrimestre",
    "nombre": "Variante A",
    "trayectoriaId": 1,
    "planificacionOrigenId": 3
}
```

| Código | Descripción |
|---|---|
| 201 | Período creado |
| 400 | Error de validación (orden cronológico, origen no pertenece a la trayectoria, etc.) |
| 404 | Inscripción / trayectoria / origen no encontrado |

### DELETE /api/planificacion/periodos/:id

Elimina un período de planificación. Las `MateriaPlanificada` asociadas se eliminan por `ON DELETE CASCADE` en la FK. Si el período tiene continuaciones (hijos en la trayectoria), se eliminan en cascada por `ON DELETE CASCADE` en `planificacion_origen_id`.

| Código | Descripción |
|---|---|
| 200 | Período eliminado (más todos sus descendientes) |
| 404 | Período no encontrado |

> **Nota de implementación frontend:** Al eliminar un período, el frontend **limpia primero `periodoActivo` (set null)** y **cancela/elimina las queries de `materias-desbloqueables` para ese período ANTES de invalidar queries**, evitando que el hook `usePlanificacion` intente hacer fetch de materias desbloqueables para un período que ya no existe (lo que causaba 404).

### PATCH /api/planificacion/periodos/:id

Actualiza un período de planificación (año, instancia, nombre).

**Request Body:**
```json
{
    "anio": 2026,
    "instancia": "1er Cuatrimestre",
    "nombre": "Variante B"
}
```

| Código | Descripción |
|---|---|
| 200 | Período actualizado |
| 400 | Error de validación |
| 404 | Período no encontrado |

### GET /api/planificacion/bloques

Retorna el catálogo de todos los bloques horarios disponibles (7 bloques de 2 horas).

| Código | Descripción |
|---|---|
| 200 | `[{ bloqueId, horaInicio, horaFin }]` |

### GET /api/planificacion/periodos/:id/materias

Retorna todas las materias planificadas dentro de un período, agrupadas por día y bloque. Si el período no existe retorna `[]` (no 404).

| Código | Descripción |
|---|---|
| 200 | `[{ planificacionId, materia: { id, nombre, codigo }, bloque: { id, horaInicio, horaFin }, diaSemana }]` |

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
|---|---|---|
| 201 | Materia planificada exitosamente |
| 400 | Conflicto de horario (el bloque ya está ocupado en ese día) |
| 400 | La materia ya tiene todas sus horas planificadas (excede `cargaHoraria`) |
| 400 | Correlativas pendientes de aprobación |
| 404 | Período o materia no encontrada |

### GET /api/planificacion/disponibles?usuarioCarreraId=:id&trayectoriaId=:tid&periodoId=:pid

Materias que el usuario puede planificar (no completadas, con correlativas cumplidas). Devueltas ordenadas alfabéticamente por `nombre`.

Cuando se especifican `trayectoriaId` y `periodoId`, se activa la lógica de **cadena de ancestros**: las materias planificadas en la línea de ancestros del período actual (vía `planificacionOrigenId`) se excluyen de disponibles y cuentan como cumplidas para correlativas. Las materias en forks hermanos no se ven afectadas.

| Código | Descripción |
|---|---|
| 200 | `[{ materiaId, nombre, codigo, creditos, cargaHoraria, ... }]` |
| 404 | Inscripción no encontrada |

### GET /api/planificacion/periodos/:id/materias-desbloqueables

Retorna las materias que se desbloquearían (todas sus correlativas estarían cumplidas) si el usuario completara todas las materias indicadas. Devueltas ordenadas alfabéticamente por `nombre`. Si el período no existe retorna `[]` (no 404).

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` (path) | `number` | ID del período |
| `materiaIds` (query, opcional) | `string` | IDs de materias separados por coma. |

| Código | Descripción |
|---|---|
| 200 | `[{ materiaId, nombre, codigo, creditos, ... }]` |
| 404 | Período no encontrado |

> Comportamiento: Si se envía `materiaIds`, reemplaza **completamente** el conjunto de materias
> planificadas (ignora las guardadas en DB). Si no se envía, usa las materias persistidas en DB.
> Esto permite al frontend calcular desbloqueables según la selección actual del calendario,
> incluso cuando se sacan materias ya guardadas.

### DELETE /api/planificacion/materias/:id

Elimina una materia de la planificación.

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `modo` | `'simple' \| 'cascade'` | No | `'simple'` (default): elimina solo esa materia. `'cascade'`: elimina todos los bloques de esa materia en el período actual + todas las materias dependientes (todos sus bloques) en planes hijos. |

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

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsInt()
    trayectoriaId?: number;

    @ApiPropertyOptional({ example: 3 })
    @IsOptional()
    @IsInt()
    planificacionOrigenId?: number;
}
```

### ActualizarPeriodoDto

```typescript
import { IsOptional, IsInt, IsEnum, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarPeriodoDto {
    @ApiPropertyOptional({ example: 2026 })
    @IsOptional()
    @IsInt()
    anio?: number;

    @ApiPropertyOptional({ enum: ['Verano', '1er Cuatrimestre', '2do Cuatrimestre'] })
    @IsOptional()
    @IsEnum(['Verano', '1er Cuatrimestre', '2do Cuatrimestre'])
    instancia?: 'Verano' | '1er Cuatrimestre' | '2do Cuatrimestre';

    @ApiPropertyOptional({ example: 'Variante B' })
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

### ActualizarPeriodoDto

```typescript
import { IsOptional, IsInt, IsEnum, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarPeriodoDto {
    @ApiPropertyOptional({ example: 2026 })
    @IsOptional()
    @IsInt()
    anio?: number;

    @ApiPropertyOptional({ enum: ['Verano', '1er Cuatrimestre', '2do Cuatrimestre'] })
    @IsOptional()
    @IsEnum(['Verano', '1er Cuatrimestre', '2do Cuatrimestre'])
    instancia?: string;

    @ApiPropertyOptional({ example: 'Variante B' })
    @IsOptional()
    @MaxLength(100)
    nombre?: string;
}
```

---

## Lógica del Service

### PlanificacionService

```typescript
import { Repository, In, IsNull } from 'typeorm';

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
        @InjectRepository(Correlativa)
        private readonly correlativaRepo: Repository<Correlativa>,
        @InjectRepository(ProgresoMateria)
        private readonly progresoRepo: Repository<ProgresoMateria>,
        @InjectRepository(CarreraMateria)
        private readonly carreraMateriaRepo: Repository<CarreraMateria>,
        @InjectRepository(Trayectoria)
        private readonly trayectoriaRepo: Repository<Trayectoria>,
    ) {}

    async listarPeriodos(usuarioCarreraId: number, independientes?: boolean): Promise<PeriodoPlanificacion[]> {
        const where = independientes
            ? {
                usuarioCarrera: { usuarioCarreraId },
                trayectoriaId: IsNull(),
              }
            : {
                usuarioCarrera: { usuarioCarreraId },
              };
        return this.periodoRepo.find({
            where,
            relations: ['materiasPlanificadas', 'materiasPlanificadas.materia', 'materiasPlanificadas.bloque', 'trayectoria', 'planificacionOrigen'],
            order: { anio: 'DESC', instancia: 'ASC' },
        });
    }

    async crearPeriodo(dto: CrearPeriodoDto): Promise<PeriodoPlanificacion> {
        const inscripcion = await this.usuarioCarreraRepo.findOne({
            where: { usuarioCarreraId: dto.usuarioCarreraId },
        });
        if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

        if (dto.trayectoriaId !== undefined) {
            const trayectoria = await this.trayectoriaRepo.findOne({
                where: { trayectoriaId: dto.trayectoriaId },
            });
            if (!trayectoria) throw new NotFoundException('Trayectoria no encontrada');
            if (trayectoria.usuarioCarreraId !== dto.usuarioCarreraId) {
                throw new BadRequestException('La trayectoria no pertenece a esta inscripción');
            }
            await this.validarOrdenCronologico(
                dto.trayectoriaId, dto.anio, dto.instancia, dto.planificacionOrigenId,
            );
            if (dto.planificacionOrigenId !== undefined) {
                const origen = await this.periodoRepo.findOne({
                    where: { periodoId: dto.planificacionOrigenId },
                });
                if (!origen) throw new NotFoundException('Planificación origen no encontrada');
                if (origen.trayectoriaId !== dto.trayectoriaId) {
                    throw new BadRequestException('La planificación origen no pertenece a esta trayectoria');
                }
            }
        } else if (dto.planificacionOrigenId !== undefined) {
            throw new BadRequestException('Una planificación con origen debe pertenecer a una trayectoria');
        }

        const periodo = this.periodoRepo.create({
            usuarioCarrera: inscripcion,
            trayectoriaId: dto.trayectoriaId ?? null,
            planificacionOrigenId: dto.planificacionOrigenId ?? null,
            anio: dto.anio,
            instancia: dto.instancia,
            nombre: dto.nombre || null,
        });
        return this.periodoRepo.save(periodo);
    }

    private async validarOrdenCronologico(
        trayectoriaId: number,
        anio: number,
        instancia: string,
        planificacionOrigenId?: number,
    ): Promise<void> {
        const anteriores = await this.periodoRepo.find({
            where: { trayectoriaId },
            order: { anio: 'DESC', instancia: 'DESC' },
        });
        const instanciaNum = ORDEN_INSTANCIA[instancia] ?? -1;
        if (planificacionOrigenId !== undefined) {
            const origen = anteriores.find((p) => p.periodoId === planificacionOrigenId);
            if (!origen) return;
            const origenInstanciaNum = ORDEN_INSTANCIA[origen.instancia] ?? -1;
            if (anio < origen.anio || (anio === origen.anio && instanciaNum <= origenInstanciaNum)) {
                throw new ConflictException('El nuevo período debe ser cronológicamente posterior al período origen.');
            }
            return;
        }
        for (const p of anteriores) {
            const pInstanciaNum = ORDEN_INSTANCIA[p.instancia] ?? -1;
            if (p.anio > anio || (p.anio === anio && pInstanciaNum >= instanciaNum)) {
                throw new ConflictException('Ya existe una planificación posterior o igual en esta trayectoria.');
            }
        }
    }

    // ... resto de métodos
}
```

> **Nota:** `IsNull()` de TypeORM es necesario para filtrar por NULL. TypeORM rechaza `null` literal en where.

---

## Entidades TypeORM

### PeriodoPlanificacionEntity

```typescript
@Entity('periodo_planificacion')
export class PeriodoPlanificacion {
    @PrimaryGeneratedColumn()
    periodoId: number;

    @ManyToOne(() => UsuarioCarrera, (uc) => uc.periodos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usuario_carrera_id' })
    usuarioCarrera: UsuarioCarrera;

    @ManyToOne(() => Trayectoria, (t) => t.planificaciones, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'trayectoria_id' })
    trayectoria?: Trayectoria;

    @Column({ name: 'trayectoria_id', type: 'int', nullable: true })
    trayectoriaId: number | null;

    @ManyToOne(() => PeriodoPlanificacion, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'planificacion_origen_id' })
    planificacionOrigen?: PeriodoPlanificacion;

    @Column({ name: 'planificacion_origen_id', type: 'int', nullable: true })
    planificacionOrigenId: number | null;

    @Column({ type: 'int' })
    anio: number;

    @Column({ type: 'enum', enum: ['Verano', '1er Cuatrimestre', '2do Cuatrimestre'] })
    instancia: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    nombre: string;

    @OneToMany(() => PeriodoPlanificacion, (pp) => pp.planificacionOrigen)
    continuaciones: PeriodoPlanificacion[];

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

    @ManyToOne(() => PeriodoPlanificacion, (pp) => pp.materiasPlanificadas, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'periodo_id' })
    periodo: PeriodoPlanificacion;

    @ManyToOne(() => Materia, { onDelete: 'CASCADE' })
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
| Una materia puede ocupar múltiples bloques en distintos días, pero no exceder su `cargaHoraria` semanal | Backend: `Math.ceil(cargaHoraria / 2)` bloques máximo. Frontend valida `horasAsignadas >= cargaHoraria` antes de impedir agregar otro bloque (permite bloques parciales para cargas horarias impares) |
| No se puede planificar una materia si no se cumplen sus correlativas | Validación contra `obtenerMateriasDisponibles` (misma lógica que el listado del frontend; considera completadas + planificadas previas en la cadena de ancestros de la trayectoria) |
| Las materias que se desbloquearían al completar la planificación se calculan en `GET /periodos/:id/materias-desbloqueables` | Endpoint dedicado que compara planificadas + completadas vs. correlativas del plan |
| Solo existen 7 bloques fijos: 08-10, 10-12, 12-14, 14-16, 16-18, 18-20, 20-22 | Catálogo predefinido en base de datos (seed) |
| Los días disponibles son Lunes a Sábado | ENUM en la entidad |
| Un período pertenece siempre a un usuario y una carrera | FK a `usuario_carrera` |
| Un usuario puede tener múltiples planificaciones para el mismo año/instancia | Campo `nombre` opcional para distinguirlas |
| Al listar con `independientes=true` se filtran períodos con `trayectoria_id IS NULL` | Usa `IsNull()` de TypeORM |
| Al crear en una trayectoria, validar orden cronológico | `validarOrdenCronologico` |
| Al crear con `planificacionOrigenId`, solo validar contra el origen (fork) | `validarOrdenCronologico` con `planificacionOrigenId` |
| La FK `usuario_carrera_id` tiene `ON DELETE CASCADE` | Eliminación en cascada al borrar inscripción |
| La FK `trayectoria_id` tiene `ON DELETE SET NULL` | Al eliminar una trayectoria, los períodos se desvinculan (no se eliminan) |
| La FK `planificacion_origen_id` tiene `ON DELETE CASCADE` | Al eliminar un período padre, los hijos se eliminan en cascada |
| La FK `periodo_id` en `materia_planificada` tiene `ON DELETE CASCADE` | Al eliminar un período, sus materias planificadas se eliminan |
| La FK `materia_id` en `materia_planificada` tiene `ON DELETE CASCADE` | Al eliminar una materia, sus planificaciones se eliminan |
