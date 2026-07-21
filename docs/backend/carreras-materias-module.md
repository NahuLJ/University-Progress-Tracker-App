# Módulo Carreras y Materias — Especificación Técnica


> ✅ **Implementado en `backend/`** — Código completo y compilando sin errores.

## Endpoints de la API

### GET /api/carreras

Lista todas las carreras disponibles en el sistema.

| Código | Descripción |
|---|---|
| 200 | `[{ carreraId, nombre, descripcion, duracionAnios }]` |

### GET /api/carreras/:id

Obtiene los detalles de una carrera específica.

| Código | Descripción |
|---|---|
| 200 | `{ carreraId, nombre, descripcion, duracionAnios, planEstudios: [...] }` |
| 404 | Carrera no encontrada |

### GET /api/carreras/:id/plan-estudios

Retorna el plan de estudios completo de la carrera. Las materias vienen ordenadas por año y cuatrimestre, cada una con sus correlativas.
Acepta query param opcional `usuarioCarreraId` para mergear el progreso del usuario en cada materia **y en cada correlativa**.

| Código | Descripción |
|---|---|
| 200 | `[{ materiaId, nombre, codigo, creditos, anio, cuatrimestre, orden, correlativas: [{ correlativaId, materiaCorrelativaId, materiaCorrelativa: { nombre, codigo }, estadoUsuario?, nota?, tipoAprobacion? }], estadoUsuario?, nota?, tipoAprobacion? }]` |
| 404 | Carrera no encontrada |

### POST /api/carreras

Crea una nueva carrera (solo administradores).

**Request Body:**
```json
{
    "nombre": "Ingeniería en Sistemas",
    "descripcion": "Carrera de grado orientada al desarrollo de software",
    "duracionAnios": 5.0
}
```

| Código | Descripción |
|---|---|
| 201 | Carrera creada |
| 400 | Error de validación |

### POST /api/carreras/:id/materias

Agrega una materia al plan de estudios de una carrera.

**Request Body:**
```json
{
    "materiaId": 5,
    "anio": 2,
    "cuatrimestre": 1,
    "orden": 3
}
```

| Código | Descripción |
|---|---|
| 201 | Materia agregada al plan |
| 400 | La materia ya existe en el plan de esta carrera |
| 404 | Carrera o materia no encontrada |

### GET /api/materias

Lista todas las materias del catálogo global.

| Código | Descripción |
|---|---|
| 200 | `[{ materiaId, nombre, codigo, creditos, cargaHoraria }]` |

### GET /api/materias/:id

Obtiene los detalles de una materia, incluyendo sus correlativas y las carreras donde se dicta.
Acepta query param opcional `carreraId` para filtrar correlativas por carrera (si se omite, se incluyen todas).

| Código | Descripción |
|---|---|
| 200 | `{ materiaId, nombre, codigo, descripcion, cargaHoraria, creditos, correlativas: [...], carreras: [...] }` |
| 404 | Materia no encontrada |

### POST /api/materias

Crea una nueva materia en el catálogo global.

**Request Body:**
```json
{
    "nombre": "Álgebra Lineal",
    "codigo": "MAT102",
    "descripcion": "Espacios vectoriales, transformaciones lineales",
    "cargaHoraria": 96,
    "creditos": 8
}
```

| Código | Descripción |
|---|---|
| 201 | Materia creada |
| 400 | Error de validación (código duplicado, etc.) |

### POST /api/materias/:id/correlativas

Asigna una materia correlativa a otra. La materia `materiaCorrelativaId` debe ser aprobada antes de cursar la materia `:id`.

**Request Body:**
```json
{
    "materiaCorrelativaId": 3,
    "carreraId": 1
}
```
El campo `carreraId` es opcional. Si se provee, la correlativa se asigna solo a esa carrera.

| Código | Descripción |
|---|---|
| 201 | Correlativa asignada |
| 400 | La correlativa ya existe o es auto-referencial |
| 404 | Materia no encontrada |

### DELETE /api/materias/:id/correlativas/:correlativaId

Elimina una correlativa existente. Acepta query param opcional `?carreraId=` para filtrar por carrera.

| Código | Descripción |
|---|---|
| 200 | Correlativa eliminada |
| 404 | Correlativa no encontrada |

---

## DTOs

### CrearCarreraDto

```typescript
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearCarreraDto {
    @ApiProperty({ example: 'Ingeniería en Sistemas' })
    @IsString()
    @MinLength(3)
    @MaxLength(200)
    nombre: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    descripcion?: string;

    @ApiProperty({ example: 5.0 })
    @IsNumber({ maxDecimalPlaces: 1 })
    @Min(1)
    @Max(10)
    duracionAnios: number;
}
```

### AgregarMateriaPlanDto

```typescript
import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AgregarMateriaPlanDto {
    @ApiProperty({ example: 5 })
    @IsInt()
    materiaId: number;

    @ApiProperty({ example: 2 })
    @IsInt()
    @Min(1)
    anio: number;

    @ApiProperty({ example: 1 })
    @IsInt()
    @Min(1)
    cuatrimestre: number;

    @ApiProperty({ example: 3 })
    @IsInt()
    @Min(1)
    orden: number;
}
```

### CrearMateriaDto

```typescript
import { IsString, IsInt, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearMateriaDto {
    @ApiProperty({ example: 'Álgebra Lineal' })
    @IsString()
    @MaxLength(200)
    nombre: string;

    @ApiProperty({ example: 'MAT102' })
    @IsString()
    @MaxLength(20)
    codigo: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    descripcion?: string;

    @ApiProperty({ example: 96 })
    @IsInt()
    @Min(1)
    cargaHoraria: number;

    @ApiProperty({ example: 8 })
    @IsInt()
    @Min(1)
    creditos: number;
}
```

### AsignarCorrelativaDto

```typescript
import { IsInt, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AsignarCorrelativaDto {
    @ApiProperty({ example: 3, description: 'ID de la materia que actúa como correlativa (requisito)' })
    @IsInt()
    materiaCorrelativaId: number;

    @ApiPropertyOptional({ example: 1, description: 'ID de la carrera (opcional). Si se provee, la correlativa aplica solo a esa carrera' })
    @IsOptional()
    @IsInt()
    carreraId?: number;
}
```

---

## Lógica del Service

### CarrerasService

```typescript
@Injectable()
export class CarrerasService {
    constructor(
        @InjectRepository(Carrera)
        private readonly carreraRepo: Repository<Carrera>,
        @InjectRepository(CarreraMateria)
        private readonly carreraMateriaRepo: Repository<CarreraMateria>,
        @InjectRepository(Materia)
        private readonly materiaRepo: Repository<Materia>,
    ) {}

    async listar(): Promise<Carrera[]> {
        return this.carreraRepo.find({ order: { nombre: 'ASC' } });
    }

    async obtenerConPlan(id: number): Promise<Carrera> {
        const carrera = await this.carreraRepo.findOne({
            where: { carreraId: id },
            relations: ['planEstudios', 'planEstudios.materia'],
        });
        if (!carrera) throw new NotFoundException('Carrera no encontrada');
        return carrera;
    }

    async obtenerPlanEstudios(carreraId: number, usuarioCarreraId?: number): Promise<...> {
        const carrera = await this.carreraRepo.findOne({ where: { carreraId } });
        if (!carrera) throw new NotFoundException('Carrera no encontrada');

        const entries = await this.carreraMateriaRepo.find({
            where: { carrera: { carreraId } },
            relations: {
                materia: { correlativasRequeridas: { materiaCorrelativa: true } },
            },
            order: { orden: 'ASC' },
        });

        const progresoMap = new Map<number, { estado: string; nota: number | null; tipoAprobacion: string | null }>();
        if (usuarioCarreraId) {
            const progresos = await this.progresoRepo.find({
                where: { usuarioCarrera: { usuarioCarreraId } },
                relations: { materia: true, estado: true },
            });
            for (const p of progresos) {
                progresoMap.set(p.materia.materiaId, {
                    estado: p.estado.nombre,
                    nota: p.nota,
                    tipoAprobacion: p.tipoAprobacion,
                });
            }
        }

        // Mapea cada materia con su progreso y el progreso de sus correlativas
        const materias = entries.map((e) => {
            const prog = progresoMap.get(e.materia.materiaId);
            const correlativasProgreso = (e.materia.correlativasRequeridas ?? []).map((c) => {
                const corrProg = progresoMap.get(c.materiaCorrelativa.materiaId);
                return {
                    correlativaId: c.correlativaId,
                    materiaId: e.materia.materiaId,
                    materiaCorrelativaId: c.materiaCorrelativa.materiaId,
                    materiaCorrelativa: {
                        materiaId: c.materiaCorrelativa.materiaId,
                        nombre: c.materiaCorrelativa.nombre,
                        codigo: c.materiaCorrelativa.codigo,
                    },
                    estadoUsuario: corrProg?.estado ?? null,
                    nota: corrProg?.nota ?? null,
                    tipoAprobacion: corrProg?.tipoAprobacion ?? null,
                };
            });
            return {
                materiaId: e.materia.materiaId,
                carreraMateriaId: e.carreraMateriaId,
                nombre: e.materia.nombre,
                codigo: e.materia.codigo,
                descripcion: e.materia.descripcion,
                cargaHoraria: e.materia.cargaHoraria,
                creditos: e.materia.creditos,
                anio: e.anio,
                cuatrimestre: e.cuatrimestre,
                orden: e.orden,
                estadoUsuario: prog?.estado ?? null,
                nota: prog?.nota ?? null,
                tipoAprobacion: prog?.tipoAprobacion ?? null,
                correlativas: correlativasProgreso,
            };
        });

        return {
            carrera: { carreraId: carrera.carreraId, nombre: carrera.nombre, descripcion: carrera.descripcion, creditosTotales: carrera.creditosTotales },
            anios: this.agruparPorAnio(materias),
        };
    }

    async crear(dto: CrearCarreraDto): Promise<Carrera> {
        const carrera = this.carreraRepo.create(dto);
        return this.carreraRepo.save(carrera);
    }

    async agregarMateriaAlPlan(carreraId: number, dto: AgregarMateriaPlanDto): Promise<CarreraMateria> {
        const carrera = await this.carreraRepo.findOne({ where: { carreraId } });
        if (!carrera) throw new NotFoundException('Carrera no encontrada');

        const materia = await this.materiaRepo.findOne({ where: { materiaId: dto.materiaId } });
        if (!materia) throw new NotFoundException('Materia no encontrada');

        const existente = await this.carreraMateriaRepo.findOne({
            where: { carrera: { carreraId }, materia: { materiaId: dto.materiaId } },
        });
        if (existente) throw new BadRequestException('La materia ya está en el plan de estudios');

        const entry = this.carreraMateriaRepo.create({
            carrera,
            materia,
            anio: dto.anio,
            cuatrimestre: dto.cuatrimestre,
            orden: dto.orden,
        });
        return this.carreraMateriaRepo.save(entry);
    }
}
```

### MateriasService

```typescript
@Injectable()
export class MateriasService {
    constructor(
        @InjectRepository(Materia)
        private readonly materiaRepo: Repository<Materia>,
        @InjectRepository(Correlativa)
        private readonly correlativaRepo: Repository<Correlativa>,
    ) {}

    async listar(): Promise<Materia[]> {
        return this.materiaRepo.find({ order: { nombre: 'ASC' } });
    }

    async obtenerConRelaciones(id: number, carreraId?: number): Promise<Materia> {
        const materia = await this.materiaRepo.findOne({
            where: { materiaId: id },
            relations: {
                correlativasRequeridas: { materiaCorrelativa: true },
                esCorrelativaDe: { materia: true },
                planEstudios: { carrera: true },
            },
        });
        if (!materia) throw new NotFoundException('Materia no encontrada');

        if (carreraId) {
            materia.correlativasRequeridas = materia.correlativasRequeridas.filter(
                (c) => !c.carrera || c.carrera.carreraId === carreraId,
            );
            materia.esCorrelativaDe = materia.esCorrelativaDe.filter(
                (c) => !c.carrera || c.carrera.carreraId === carreraId,
            );
        }

        return materia;
    }

    async crear(dto: CrearMateriaDto): Promise<Materia> {
        const materia = this.materiaRepo.create(dto);
        try {
            return await this.materiaRepo.save(materia);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new BadRequestException('El código de materia ya existe');
            }
            throw error;
        }
    }

    async asignarCorrelativa(materiaId: number, dto: AsignarCorrelativaDto): Promise<Correlativa> {
        if (materiaId === dto.materiaCorrelativaId) {
            throw new BadRequestException('Una materia no puede ser correlativa de sí misma');
        }

        const materia = await this.materiaRepo.findOne({ where: { materiaId } });
        if (!materia) throw new NotFoundException('Materia no encontrada');

        const correlativa = await this.materiaRepo.findOne({ where: { materiaId: dto.materiaCorrelativaId } });
        if (!correlativa) throw new NotFoundException('Materia correlativa no encontrada');

        const whereClause: any = {
            materia: { materiaId },
            materiaCorrelativa: { materiaId: dto.materiaCorrelativaId },
        };
        if (dto.carreraId) {
            whereClause.carrera = { carreraId: dto.carreraId };
        }

        const existente = await this.correlativaRepo.findOne({ where: whereClause });
        if (existente) throw new BadRequestException('Esta correlativa ya está asignada en esta carrera');

        const entry = this.correlativaRepo.create({
            materia,
            materiaCorrelativa: correlativa,
            ...(dto.carreraId ? { carrera: { carreraId: dto.carreraId } } : {}),
        });
        return this.correlativaRepo.save(entry);
    }

    async eliminarCorrelativa(materiaId: number, correlativaId: number, carreraId?: number): Promise<void> {
        const whereClause: any = { correlativaId, materia: { materiaId } };
        if (carreraId) {
            whereClause.carrera = { carreraId };
        }
        const correlativa = await this.correlativaRepo.findOne({ where: whereClause });
        if (!correlativa) throw new NotFoundException('Correlativa no encontrada');
        await this.correlativaRepo.remove(correlativa);
    }
}
```

---

## Validación de Correlatividades

Función utilitaria para verificar que un usuario cumple con todas las correlativas antes de permitirle cambiar una materia a "En Proceso" o "Completada". Soporta correlativas por carrera: si se provee `carreraId`, filtra solo las correlativas de esa carrera; si no encuentra, cae a correlativas globales (null carreraId):

```typescript
private async validarCorrelativas(
    usuarioCarreraId: number,
    materiaId: number,
    carreraId?: number,
): Promise<boolean> {
    const whereClause: any = { materia: { materiaId } };
    if (carreraId) {
        whereClause.carrera = { carreraId };
    }

    const correlativas = await this.correlativaRepo.find({
        where: whereClause,
        relations: { materiaCorrelativa: true, carrera: true },
    });

    if (correlativas.length === 0) {
        if (carreraId) {
            return this.validarCorrelativas(usuarioCarreraId, materiaId); // fallback a globales
        }
        return true;
    }

    const idsCorrelativas = correlativas.map(
        (c) => c.materiaCorrelativa.materiaId,
    );

    const progresos = await this.progresoRepo.find({
        where: {
            usuarioCarrera: { usuarioCarreraId },
            materia: { materiaId: In(idsCorrelativas) },
        },
        relations: { estado: true },
    });

    const completadas = progresos.filter(
        (p) => p.estado.nombre === 'Completada',
    );
    return completadas.length === correlativas.length;
}
```

---

## Entidades TypeORM

### CarreraEntity

```typescript
@Entity('carrera')
export class Carrera {
    @PrimaryGeneratedColumn()
    carreraId: number;

    @Column({ length: 200 })
    nombre: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ name: 'duracion_anios', type: 'decimal', precision: 3, scale: 1 })
    duracionAnios: number;

    @OneToMany(() => UsuarioCarrera, (uc) => uc.carrera)
    usuarioCarreras: UsuarioCarrera[];

    @OneToMany(() => CarreraMateria, (cm) => cm.carrera)
    planEstudios: CarreraMateria[];
}
```

### CarreraMateriaEntity

```typescript
@Entity('carrera_materia')
@Unique(['carrera', 'materia'])
export class CarreraMateria {
    @PrimaryGeneratedColumn()
    carreraMateriaId: number;

    @ManyToOne(() => Carrera, (c) => c.planEstudios)
    @JoinColumn({ name: 'carrera_id' })
    carrera: Carrera;

    @ManyToOne(() => Materia, (m) => m.planEstudios)
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

### CorrelativaEntity

```typescript
@Entity('correlativa')
@Unique(['materia', 'materiaCorrelativa', 'carrera'])
@Index('IDX_correlativa_materia_id', ['materia'])
@Index('IDX_correlativa_materia_correlativa_id', ['materiaCorrelativa'])
export class Correlativa {
    @PrimaryGeneratedColumn()
    correlativaId: number;

    @ManyToOne(() => Materia, (m) => m.correlativasRequeridas)
    @JoinColumn({ name: 'materia_id' })
    materia: Materia;

    @ManyToOne(() => Materia, (m) => m.esCorrelativaDe)
    @JoinColumn({ name: 'materia_correlativa_id' })
    materiaCorrelativa: Materia;

    @ManyToOne(() => Carrera, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'carrera_id' })
    carrera?: Carrera;
}
```
