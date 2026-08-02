# Módulo Trayectoria — Especificación Técnica

> ✅ **Implementado en `backend/`** — Código completo y compilando sin errores.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/trayectorias?usuarioCarreraId=:id` | Listar trayectorias de una inscripción |
| `POST` | `/api/trayectorias` | Crear trayectoria |
| `PATCH` | `/api/trayectorias/:id` | Renombrar trayectoria |
| `DELETE` | `/api/trayectorias/:id` | Eliminar trayectoria + todas sus planificaciones en cascada |
| `GET` | `/api/trayectorias/:id/planificaciones` | Listar planificaciones de la trayectoria ordenadas por año, instancia |
| `GET` | `/api/trayectorias/:id/arbol` | Árbol de bifurcaciones |

### GET /api/trayectorias/:id/arbol

Devuelve un árbol recursivo:

```json
{
  "periodo": { "periodoId": 1, "anio": 2026, ... },
  "hijos": [
    { "periodo": { "periodoId": 2, ... }, "hijos": [] },
    { "periodo": { "periodoId": 3, ... }, "hijos": [...] }
  ]
}
```

## Entidad Trayectoria

```typescript
@Entity('trayectoria')
export class Trayectoria {
    @PrimaryGeneratedColumn()
    trayectoriaId: number;

    @ManyToOne(() => UsuarioCarrera, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usuario_carrera_id' })
    usuarioCarrera: UsuarioCarrera;

    @Column({ name: 'usuario_carrera_id' })
    usuarioCarreraId: number;

    @Column({ length: 150 })
    nombre: string;

    @CreateDateColumn({ name: 'creado_en' })
    creadoEn: Date;

    @OneToMany(() => PeriodoPlanificacion, pp => pp.trayectoria)
    planificaciones: PeriodoPlanificacion[];
}
```

## Entidad PeriodoPlanificacion (campos agregados)

```typescript
@ManyToOne(() => Trayectoria, (t) => t.planificaciones, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'trayectoria_id' })
trayectoria?: Trayectoria;

@Column({ name: 'trayectoria_id', nullable: true })
trayectoriaId?: number;

@ManyToOne(() => PeriodoPlanificacion, { nullable: true, onDelete: 'CASCADE' })
@JoinColumn({ name: 'planificacion_origen_id' })
planificacionOrigen?: PeriodoPlanificacion;

@Column({ name: 'planificacion_origen_id', nullable: true })
planificacionOrigenId?: number;

@OneToMany(() => PeriodoPlanificacion, pp => pp.planificacionOrigen)
continuaciones: PeriodoPlanificacion[];
```

## DTOs

### CrearTrayectoriaDto

```typescript
export class CrearTrayectoriaDto {
    @IsInt()
    usuarioCarreraId: number;

    @IsString()
    @MaxLength(150)
    nombre: string;
}
```

### ActualizarTrayectoriaDto

```typescript
export class ActualizarTrayectoriaDto {
    @IsOptional()
    @IsString()
    @MaxLength(150)
    nombre?: string;
}
```

### CrearPeriodoDto (extendido)

```typescript
export class CrearPeriodoDto {
    @IsInt()
    usuarioCarreraId: number;

    @IsInt()
    anio: number;

    @IsEnum(['Verano', '1er Cuatrimestre', '2do Cuatrimestre'])
    instancia: string;

    @IsOptional()
    @MaxLength(100)
    nombre?: string;

    @IsOptional()
    @IsInt()
    trayectoriaId?: number;

    @IsOptional()
    @IsInt()
    planificacionOrigenId?: number;
}
```

## Lógica del Service

### CrearPeriodo — validaciones

1. Si `trayectoriaId` está presente:
   - Validar que la trayectoria exista y pertenezca al `usuarioCarreraId`.
   - Validar orden cronológico (`validarOrdenCronologico`).
2. Si `planificacionOrigenId` está presente:
   - Validar que pertenezca a la misma trayectoria.
   - La validación cronológica solo verifica que el nuevo período sea posterior al origen (fork permitido).
3. Si no hay `trayectoriaId` pero hay `planificacionOrigenId` → error.

### validarOrdenCronologico(trayectoriaId, anio, instancia, planificacionOrigenId?)

- Sin `planificacionOrigenId`: el nuevo período debe ser posterior a **todos** los existentes en la trayectoria.
- Con `planificacionOrigenId`: el nuevo período solo debe ser posterior al período origen (permite bifurcaciones aunque existan otros períodos en la misma posición).

### Materias disponibles en fork — cadena completa

`obtenerMateriasDisponibles()` (en `PlanificacionService`) calcula las materias disponibles para un período dentro de una trayectoria. En lugar de considerar **todos** los periodos de la trayectoria, recorre solo la **cadena completa** que contiene al período actual vía `planificacionOrigenId`:

- Se construye un `Map<periodoId, PeriodoPlanificacion>` y un mapa `hijosPorOrigen` con todos los periodos de la trayectoria.
- Se sube por `planificacionOrigenId` hasta la raíz (**ancestros**): sus materias van a `idsPlanificadasEnTrayectoria` (excluidas de disponibles) y a `idsPlanificadasPrevias` (cuentan como cumplidas para correlativas).
- Se baja recursivamente por los hijos (`hijosPorOrigen`) (**descendientes**): sus materias van solo a `idsPlanificadasEnTrayectoria` — ya están ubicadas en la línea temporal del camino y no deben volver a planificarse, pero no desbloquean correlativas.

Esto asegura que cada **fork** tenga su propia lista independiente de materias disponibles. Si B y C son hijos de A, las materias planificadas en B no se excluyen de la lista de C, y viceversa; pero si `a` está planificada en B, no aparece en A ni en ninguna planificación de la cadena A→B.

En `obtenerMateriasDesbloqueables()` el patrón es distinto: solo se recorren los **ancestros** (períodos anteriores) para excluir materias ya planificadas y considerarlas cumplidas para correlativas. Las materias planificadas en planificaciones **futuras** (descendientes) no se excluyen: la lista de materias a desbloquear siempre se muestra completa. Además, solo se listan materias cuyo desbloqueo depende de la planificación actual (todas sus correlativas cumplidas y **al menos una correlativa planificada en el período actual**).

### Listar períodos — filtro independientes

`listarPeriodos(usuarioCarreraId, independientes?)` y `listarPeriodosPaginado(usuarioCarreraId, page, limit, independientes?)` aceptan un booleano opcional. Cuando es `true`, agregan `where.trayectoriaId = IsNull()` (usando `IsNull` de TypeORM, no `null` literal).

### Eliminación en cascada

Todas las FK involucradas usan `ON DELETE CASCADE`, excepto `trayectoria_id` en `periodo_planificacion` que usa `ON DELETE SET NULL` (al eliminar una trayectoria los períodos se desvinculan pero no se eliminan). La BD elimina automáticamente toda la subrama descendiente de períodos vía `planificacion_origen_id` con `ON DELETE CASCADE`.
