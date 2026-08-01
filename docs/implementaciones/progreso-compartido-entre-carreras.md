# Progreso compartido entre carreras

## Problema

Actualmente `ProgresoMateria` tiene `UNIQUE(usuario_carrera_id, materia_id)`, lo que ata el progreso a una inscripción específica. Si una misma materia existe en dos carreras distintas, el usuario debe registrar el progreso dos veces.

## Solución

Cambiar la FK de `usuario_carrera_id` → `usuario_id` y la unique a `UNIQUE(usuario_id, materia_id)`. El progreso pasa a ser del usuario sobre la materia, independientemente de la carrera desde la que se accede.

---

## 1. Base de datos

El backend usa `synchronize: true` (`backend/src/config/database.config.ts`), por lo que el esquema se sincroniza automáticamente desde las entidades. **No se usan TypeORM migrations** (no existe `src/migrations/` ni `src/config/typeorm.config.ts`, y `package.json` no tiene scripts de CLI de typeorm).

No hace falta migration: basta con **recrear la base de datos** (o dropear la tabla `progreso_materia` y reiniciar el backend) para que TypeORM cree la tabla con el nuevo esquema definido por la entidad. Antes de recrear, si hubiera datos que preservar, hacer backup.

Esquema resultante de `progreso_materia`:
- FK `usuario_id` → `usuario.usuario_id` `ON DELETE CASCADE`.
- `UNIQUE (usuario_id, materia_id)`.
- Se elimina la columna y FK `usuario_carrera_id`.

---

## 2. Backend — Entity: `ProgresoMateria`

**Archivo:** `backend/src/modules/progreso/entities/progreso-materia.entity.ts`

| Cambio | Antes | Después |
|---|---|---|
| Unique | `@Unique(['usuarioCarrera', 'materia'])` | `@Unique(['usuario', 'materia'])` |
| FK ManyToOne | `usuarioCarrera: UsuarioCarrera` | `usuario: Usuario` |
| JoinColumn | `usuario_carrera_id` | `usuario_id` |
| Import | `UsuarioCarrera` | `Usuario` |

```typescript
// Antes
@Unique(['usuarioCarrera', 'materia'])
export class ProgresoMateria {
  @ManyToOne(() => UsuarioCarrera, (uc) => uc.progresos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_carrera_id' })
  usuarioCarrera: UsuarioCarrera;
  // ...
}

// Después
@Unique(['usuario', 'materia'])
export class ProgresoMateria {
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
  // ...
}
```

Importar `Usuario` desde `../../usuarios/entities/usuario.entity`.

---

## 3. Backend — Entity: `Usuario`

**Archivo:** `backend/src/modules/usuarios/entities/usuario.entity.ts`

Agregar `@OneToMany` a `ProgresoMateria` (opcional, útil para queries desde el lado usuario):

```typescript
import { ProgresoMateria } from '../../progreso/entities/progreso-materia.entity';

@OneToMany(() => ProgresoMateria, (pm) => pm.usuario)
progresos: ProgresoMateria[];
```

---

## 4. Backend — Entity: `UsuarioCarrera`

**Archivo:** `backend/src/modules/carreras/entities/usuario-carrera.entity.ts`

Eliminar la relación `@OneToMany` a `ProgresoMateria` (ya no existe FK desde `progreso_materia` → `usuario_carrera`):

```typescript
// ELIMINAR:
@OneToMany(() => ProgresoMateria, (pm) => pm.usuarioCarrera)
progresos: ProgresoMateria[];
```

---

## 5. Backend — Service: `ProgresoService`

**Archivo:** `backend/src/modules/progreso/progreso.service.ts`

### 5.1 `obtenerPorCarrera(usuarioCarreraId)`

```typescript
// Cambiar la búsqueda de progreso:
// Antes (por usuarioCarreraId):
const progresos = await this.progresoRepo.find({
  where: { usuarioCarrera: { usuarioCarreraId } },
  relations: { materia: true, estado: true },
});

// Después (por usuarioId derivado de la inscripción):
const inscripcion = await this.usuarioCarreraRepo.findOne({
  where: { usuarioCarreraId },
  relations: { carrera: true, usuario: true },
});
if (!inscripcion) return [];

const progresos = await this.progresoRepo.find({
  where: { usuario: { usuarioId: inscripcion.usuario.usuarioId } },
  relations: { materia: true, estado: true },
});
```

> Nota: este método solo devuelve materias que tienen progreso registrado. Con progreso compartido, al entrar a una carrera nueva las materias exclusivas sin registro no aparecen hasta inicializar — ver §14.4 (auto-init).

### 5.2 `inicializar(dto)`

```typescript
// Obtener usuarioId desde la inscripción (agregar relations usuario: true):
const inscripcion = await this.usuarioCarreraRepo.findOne({
  where: { usuarioCarreraId: dto.usuarioCarreraId },
  relations: { carrera: true, usuario: true },
});
if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');
const usuarioId = inscripcion.usuario.usuarioId;

// En el loop, cambiar el check de existencia:
// Antes:
const yaExiste = await this.progresoRepo.findOne({
  where: {
    usuarioCarrera: { usuarioCarreraId: dto.usuarioCarreraId },
    materia: { materiaId: entry.materia.materiaId },
  },
});

// Después:
const yaExiste = await this.progresoRepo.findOne({
  where: {
    usuario: { usuarioId },
    materia: { materiaId: entry.materia.materiaId },
  },
});

// Al crear, cambiar:
// Antes:
const nuevo = this.progresoRepo.create({
  usuarioCarrera: { usuarioCarreraId: dto.usuarioCarreraId },
  materia: { materiaId: entry.materia.materiaId },
  estado: estadoPendiente!,
});

// Después:
const nuevo = this.progresoRepo.create({
  usuario: { usuarioId },
  materia: { materiaId: entry.materia.materiaId },
  estado: estadoPendiente!,
});
```

### 5.3 `actualizar(id, dto)`

```typescript
// Cambiar la relación cargada:
// Antes:
const progreso = await this.progresoRepo.findOne({
  where: { progresoId: id },
  relations: { materia: true, usuarioCarrera: { carrera: true } },
});

// Después (necesitamos carreraId para validar correlativas):
const progreso = await this.progresoRepo.findOne({
  where: { progresoId: id },
  relations: { materia: true, usuario: true },
});
if (!progreso) throw new NotFoundException('Progreso no encontrado');
```

**Problema:** Para validar correlativas necesitamos `carreraId`, pero el progreso ya no tiene relación directa con `UsuarioCarrera`. Soluciones:

- **Opción A (recomendada):** Recibir `carreraId` en el DTO de actualización (el frontend lo conoce).
- **Opción B:** Buscar la carrera activa del usuario que contenga la materia (más complejo, puede haber múltiples).

**Implementación Opción A** — Agregar `carreraId` a `ActualizarProgresoDto` (ver §8) y pasarlo al service. En el controlador, el frontend ya envía `carreraId` (se obtiene de `carreraActiva.carrera.carreraId`).

En el call-site de `validarCorrelativas` dentro de `actualizar`, cambiar los argumentos:

```typescript
// Antes:
this.validarCorrelativas(
  progreso.usuarioCarrera.usuarioCarreraId,
  progreso.materia.materiaId,
  progreso.usuarioCarrera.carrera.carreraId,
);

// Después:
this.validarCorrelativas(
  progreso.usuario.usuarioId,
  progreso.materia.materiaId,
  dto.carreraId,
);
```

### 5.4 `validarCorrelativas`

```typescript
// Antes: recibe usuarioCarreraId
private async validarCorrelativas(
  usuarioCarreraId: number,
  materiaId: number,
  carreraId: number,
): Promise<boolean>

// Después: recibe usuarioId
private async validarCorrelativas(
  usuarioId: number,
  materiaId: number,
  carreraId: number,
): Promise<boolean>
{
  // ... (cambiar consulta)
  const progresos = await this.progresoRepo.find({
    where: {
      usuario: { usuarioId },     // <-- antes: usuarioCarrera: { usuarioCarreraId }
      materia: { materiaId: In(idsCorrelativas) },
    },
    relations: { estado: true },
  });
  // ...
}
```

> Con progreso compartido, una correlativa completada en otra carrera del usuario cuenta como aprobada. Este es el comportamiento deseado.

---

## 6. Backend — Service: `CarrerasService`

**Archivo:** `backend/src/modules/carreras/carreras.service.ts`

### 6.1 `obtenerPlanEstudios(carreraId, usuarioCarreraId?)`

Devuelve el plan con `estadoUsuario`, `nota` y `tipoAprobacion` de cada materia y sus correlativas. Cambiar la búsqueda de progreso para usar el `usuarioId` de la inscripción:

```typescript
// Antes:
if (usuarioCarreraId) {
  const progresos = await this.progresoRepo.find({
    where: { usuarioCarrera: { usuarioCarreraId } },
    relations: { materia: true, estado: true },
  });
  // ...
}

// Después:
let usuarioId: number | undefined;
if (usuarioCarreraId) {
  const inscripcion = await this.usuarioCarreraRepo.findOne({
    where: { usuarioCarreraId },
    relations: { usuario: true },
  });
  usuarioId = inscripcion?.usuario?.usuarioId;
}

if (usuarioId) {
  const progresos = await this.progresoRepo.find({
    where: { usuario: { usuarioId } },
    relations: { materia: true, estado: true },
  });
  // ...
}
```

### 6.2 `quitarMateriaDelPlan(carreraId, carreraMateriaId)`

El borrado de progreso usa la FK que se elimina, así que rompe. Cambiar la consulta de `usuarioCarrera` a `usuario`:

```typescript
// Antes:
const usuarioCarreras = await queryRunner.manager.find(UsuarioCarrera, {
  where: { carrera: { carreraId } },
});
const usuarioCarreraIds = usuarioCarreras.map((uc) => uc.usuarioCarreraId);
if (usuarioCarreraIds.length > 0) {
  await queryRunner.manager.delete(ProgresoMateria, {
    materia: { materiaId },
    usuarioCarrera: { usuarioCarreraId: In(usuarioCarreraIds) },
  });
}

// Después:
const usuarioCarreras = await queryRunner.manager.find(UsuarioCarrera, {
  where: { carrera: { carreraId } },
  relations: { usuario: true },
});
const usuarioIds = usuarioCarreras.map((uc) => uc.usuario.usuarioId);
if (usuarioIds.length > 0) {
  await queryRunner.manager.delete(ProgresoMateria, {
    materia: { materiaId },
    usuario: { usuarioId: In(usuarioIds) },
  });
}
```

**Decisión de diseño:** con progreso compartido, este `DELETE` borra el progreso de la materia también para las otras carreras del usuario. Si se prefiere no perder progreso compartido, conviene **no borrar el `ProgresoMateria` acá** (el alta/eliminación de materias ya lo gestiona `MateriasService.eliminar`) o borrar solo cuando la materia no figure en otro plan activo del mismo usuario.

---

## 7. Backend — Service: `PlanificacionService`

**Archivo:** `backend/src/modules/planificacion/planificacion.service.ts`

El servicio consulta `ProgresoMateria` en 4 lugares. Todos deben pasar de filtrar por `usuarioCarreraId` a filtrar por `usuarioId`. Con progreso compartido, una materia completada en otra carrera cuenta como correlativa/desbloqueada.

### 7.1 `obtenerMateriasDisponibles(usuarioCarreraId)`

```typescript
// Cargar la inscripción con el usuario (agregar relations usuario: true):
const inscripcion = await this.usuarioCarreraRepo.findOne({
  where: { usuarioCarreraId },
  relations: { carrera: true, usuario: true },
});

// Antes:
const progresos = await this.progresoRepo.find({
  where: { usuarioCarrera: { usuarioCarreraId } },
  relations: { materia: true, estado: true },
});

// Después:
const progresos = await this.progresoRepo.find({
  where: { usuario: { usuarioId: inscripcion.usuario.usuarioId } },
  relations: { materia: true, estado: true },
});
```

### 7.2 `obtenerMateriasDesbloqueables(periodoId)`

```typescript
// Cargar el periodo con el usuario (agregar relations usuario: true):
const periodo = await this.periodoRepo.findOne({
  where: { periodoId },
  relations: { usuarioCarrera: { carrera: true, usuario: true } },
});

// Antes:
const progresos = await this.progresoRepo.find({
  where: { usuarioCarrera: { usuarioCarreraId } },
  relations: { materia: true, estado: true },
});

// Después (usuarioId ya disponible del periodo):
const progresos = await this.progresoRepo.find({
  where: { usuario: { usuarioId: periodo.usuarioCarrera.usuario.usuarioId } },
  relations: { materia: true, estado: true },
});
```

### 7.3 `obtenerImpactoEliminacion(materiaPlanificadaId)`

```typescript
// Cargar la inscripción con el usuario (agregar relations usuario: true):
const ucCarrera = await this.usuarioCarreraRepo.findOne({
  where: { usuarioCarreraId },
  relations: { carrera: true, usuario: true },
});

// Antes:
const progresos = await this.progresoRepo.find({
  where: { usuarioCarrera: { usuarioCarreraId } },
  relations: { materia: true, estado: true },
});

// Después:
const progresos = await this.progresoRepo.find({
  where: { usuario: { usuarioId: ucCarrera.usuario.usuarioId } },
  relations: { materia: true, estado: true },
});
```

### 7.4 `validarCorrelativas(...)`

> Nota: este método privado está actualmente sin llamadas en el archivo (código muerto). Cambiarlo es preventivo para no romper el día que se use.

```typescript
// Antes: filtra por usuarioCarreraId
const progresos = await this.progresoRepo.find({
  where: {
    usuarioCarrera: { usuarioCarreraId },
    materia: { materiaId: In(idsCorrelativas) },
  },
  relations: { estado: true, materia: true },
});

// Después: derivar usuarioId de la inscripción al inicio del método y filtrar por él
const inscripcion = await this.usuarioCarreraRepo.findOne({
  where: { usuarioCarreraId },
  relations: { usuario: true },
});
// ...
const progresos = await this.progresoRepo.find({
  where: {
    usuario: { usuarioId: inscripcion.usuario.usuarioId },
    materia: { materiaId: In(idsCorrelativas) },
  },
  relations: { estado: true, materia: true },
});
```

---

## 8. Backend — DTO: `ActualizarProgresoDto`

**Archivo:** `backend/src/modules/progreso/dto/actualizar-progreso.dto.ts`

Agregar campo `carreraId`:

```typescript
import { IsInt } from 'class-validator';

export class ActualizarProgresoDto {
  // ... campos existentes ...

  @ApiProperty({ example: 1 })
  @IsInt()
  carreraId: number;
}
```

> `carreraId` es obligatorio: si el frontend no lo manda (p. ej. `carreraActiva` sin cargar) la validación devuelve 400. Ver §14.2.

---

## 9. Backend — Controller: `ProgresoController`

**Archivo:** `backend/src/modules/progreso/progreso.controller.ts`

No requiere cambios estructurales. Los endpoints reciben los mismos parámetros. Solo verificar que `actualizar` pase `carreraId` del DTO a `progresoService.actualizar()`.

---

## 10. Backend — Module: `ProgresoModule`

**Archivo:** `backend/src/modules/progreso/progreso.module.ts`

Opcional: agregar `Usuario` al `TypeOrmModule.forFeature`. No es estrictamente necesario porque el service deriva `usuarioId` desde la inscripción y nunca inyecta `UsuarioRepo`:

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgresoMateria, EstadoMateria, UsuarioCarrera, CarreraMateria, Correlativa,
    ]),
  ],
  // ...
})
```

---

## 11. Backend — Service: `EstadisticasService`

**Archivo:** `backend/src/modules/estadisticas/estadisticas.service.ts`

Todos los métodos que buscan progreso por `usuarioCarreraId` deben cambiar a buscar por `usuarioId`.

### 11.1 `obtenerResumen(usuarioCarreraId)`

```typescript
// Obtener usuarioId desde la inscripción (agregar relations usuario: true):
const inscripcion = await this.usuarioCarreraRepo.findOne({
  where: { usuarioCarreraId },
  relations: { carrera: true, usuario: true },
});
if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');
const usuarioId = inscripcion.usuario.usuarioId;

// Cambiar query de progreso:
// Antes:
const progresos = await this.progresoRepo.find({
  where: {
    usuarioCarrera: { usuarioCarreraId },
    materia: { materiaId: In(idsMateriasPlan) },
  },
  relations: { estado: true, materia: true },
});

// Después:
const progresos = await this.progresoRepo.find({
  where: {
    usuario: { usuarioId },
    materia: { materiaId: In(idsMateriasPlan) },
  },
  relations: { estado: true, materia: true },
});
```

### 11.2 `obtenerDistribucionEstados(usuarioCarreraId)`

La distribución se calcula sobre el plan de la carrera actual, así que el query debe filtrar además por las materias del plan (si no, contaría materias completadas en otras carreras que no pertenecen a este plan):

```typescript
// Antes:
const progresos = await this.progresoRepo.find({
  where: { usuarioCarrera: { usuarioCarreraId } },
  relations: { estado: true },
});

// Después:
const inscripcion = await this.usuarioCarreraRepo.findOne({
  where: { usuarioCarreraId },
  relations: { carrera: true, usuario: true },
});
if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

const plan = await this.carreraMateriaRepo.find({
  where: { carrera: { carreraId: inscripcion.carrera.carreraId } },
  relations: { materia: true },
});
const totalPlan = plan.length;
const idsMateriasPlan = plan
  .map((cm) => cm.materia?.materiaId)
  .filter((id): id is number => id !== undefined);

const progresos = await this.progresoRepo.find({
  where: {
    usuario: { usuarioId: inscripcion.usuario.usuarioId },
    materia: { materiaId: In(idsMateriasPlan) },
  },
  relations: { estado: true },
});
```

### 11.3 `obtenerEvolucion(usuarioCarreraId)`

```typescript
// Antes:
const progresos = await this.progresoRepo.find({
  where: {
    usuarioCarrera: { usuarioCarreraId },
    estado: { nombre: 'Completada' },
    fechaCompletado: Not(IsNull()),
    nota: Not(IsNull()),
  },
  relations: { materia: true, estado: true },
});

// Después:
const inscripcion = await this.usuarioCarreraRepo.findOne({
  where: { usuarioCarreraId },
  relations: { usuario: true },
});
if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

const progresos = await this.progresoRepo.find({
  where: {
    usuario: { usuarioId: inscripcion.usuario.usuarioId },
    estado: { nombre: 'Completada' },
    fechaCompletado: Not(IsNull()),
    nota: Not(IsNull()),
  },
  relations: { materia: true, estado: true },
});
```

---

## 12. Backend — Controller: `EstadisticasController`

**Archivo:** `backend/src/modules/estadisticas/estadisticas.controller.ts`

No requiere cambios. Los endpoints siguen recibiendo `usuarioCarreraId` y `usuarioId` según corresponda.

---

## 13. Frontend — API Service: `progreso.service.ts`

**Archivo:** `frontend/src/services/progreso.service.ts`

El método `actualizarProgreso` debe enviar `carreraId` en el body del PATCH.

```typescript
// Antes:
async actualizarProgreso(id: number, data: ActualizarProgresoDto): Promise<Progreso> {
    const response = await api.patch(`/progreso/${id}`, data);
    return response.data;
}

// Después:
async actualizarProgreso(id: number, data: ActualizarProgresoDto, carreraId: number): Promise<Progreso> {
    const response = await api.patch(`/progreso/${id}`, { ...data, carreraId });
    return response.data;
}
```

---

## 14. Frontend — Hook: `useProgreso.ts`

**Archivo:** `frontend/src/hooks/useProgreso.ts`

### 14.1 Recibir `carreraId` como parámetro

```typescript
export function useProgreso(usuarioCarreraId: number | null, carreraId?: number | null) {
```

### 14.2 Pasar `carreraId` en la mutation de actualización

```typescript
const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarProgresoDto }) =>
        progresoService.actualizarProgreso(id, data, carreraId!),
    // ...
});
```

> Ojo: si `carreraId` es `null`/`undefined` (carrera activa sin cargar), `carreraId!` envía `undefined` en el body y el `@IsInt()` del DTO devuelve 400. Deshabilitar el guardado mientras no haya `carreraId` disponible.

### 14.3 Invalidar progreso de todas las carreras en vez de solo la actual

Al actualizar o eliminar, el progreso cambia globalmente (afecta a todas las carreras). Invalidar todas las queries relacionadas:

```typescript
onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['progreso'] });        // TODAS las carreras
    queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
    queryClient.invalidateQueries({ queryKey: ['plan-estudios'] });   // estadoUsuario/nota de correlativas
    queryClient.invalidateQueries({ queryKey: ['planificacion'] });   // disponibles / desbloqueables
    addNotification('Progreso actualizado', 'success');
},
```

> Sin invalidar `['plan-estudios']` y `['planificacion']`, la página de Plan de Estudios (estado de correlativas) y el Planificador (materias disponibles/desbloqueables) muestran datos viejos hasta que se refetcheen.

### 14.4 Auto-init

El auto-init actual dispara solo si la lista de progreso viene vacía (`progresos.length === 0`). Con progreso compartido esto **no alcanza**: al entrar a una carrera que comparte materias con otra, la lista viene con las materias compartidas (no vacía), el auto-init no corre y las materias **exclusivas** de la nueva carrera quedan sin registro. Como `obtenerPorCarrera` solo devuelve materias que tienen progreso (§5.1), esas materias ni siquiera aparecen en la grilla.

Cambiar la condición de disparo:

```typescript
// Opción A (recomendada): inicializar siempre al montar con una carrera activa.
// El backend ya ignora duplicados (skip-if-exists por usuarioId + materiaId).
progresoService.inicializarProgreso(usuarioCarreraId).then(() => {
    queryClient.invalidateQueries({ queryKey: ['progreso'] });
    queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
    queryClient.invalidateQueries({ queryKey: ['plan-estudios'] });
    queryClient.invalidateQueries({ queryKey: ['planificacion'] });
});

// Opción B: disparar cuando la cantidad de progresos devueltos sea menor a la
// cantidad de materias activas del plan de la carrera activa.
```

---

## 15. Frontend — Page: `ProgresoPage.tsx`

**Archivo:** `frontend/src/pages/ProgresoPage.tsx`

Pasar `carreraId` al hook:

```typescript
const {
    // ...
    actualizar,
    // ...
} = useProgreso(usuarioCarreraId, carreraActiva?.carrera?.carreraId);
```

---

## 16. Frontend — Types

**Archivo:** `frontend/src/types/progreso.types.ts`

Agregar `carreraId` al DTO:

```typescript
export interface ActualizarProgresoDto {
    estado: 'Pendiente' | 'En Proceso' | 'Completada';
    nota?: number;
    tipoAprobacion?: 'Final' | 'Promocion';
    carreraId: number;  // <-- nuevo
}
```

---

## 17. Frontend — Componente `MateriaProgresoRow.tsx`

**Archivo:** `frontend/src/components/progreso/MateriaProgresoRow.tsx`

No requiere cambios de código. El componente recibe `carreraId` como prop, pero solo lo usa para el query de detalle de materia (`['materia-detalle', materia.materiaId, carreraId]`). El guardado va por `onSave(progreso.progresoId, data)` y el `carreraId` del body lo inyecta la mutation de `useProgreso` (§14.2).

El `carreraId` llega por la cadena: `ProgresoPage` lo pasa a `useProgreso` (§15), que lo agrega en el PATCH (§13).

---

## 18. Consideraciones adicionales

### 18.1 Planificación de horarios

`MateriaPlanificada` NO referencia `ProgresoMateria`, pero `PlanificacionService` SÍ consulta `ProgresoMateria` en 4 queries por `usuarioCarreraId` — deben cambiar a `usuarioId` (ver §7). Con progreso compartido, una materia completada en otra carrera cuenta como desbloqueada en esta.

### 18.2 Trayectorias

`Trayectoria` referencia `UsuarioCarrera`, no `ProgresoMateria`. No requiere cambios.

### 18.3 Dashboard / Estadísticas

Los endpoints de estadísticas (`/resumen`, `/distribucion-estados`, `/evolucion`) siguen recibiendo `usuarioCarreraId`, pero ahora el progreso considerado es el compartido del usuario. Esto es correcto porque:
- El promedio general se calcula sobre las materias del plan de la carrera actual (porque `obtenerResumen` filtra por `In(idsMateriasPlan)`).
- La distribución de estados se calcula solo sobre las materias del plan de la carrera actual.
- La evolución histórica usa las fechas de completado del usuario.

### 18.4 `carreras-resumen`

Ya usa `usuarioId` (no `usuarioCarreraId`). No requiere cambios. Internamente llama a `obtenerResumen` que ahora usará progreso compartido, lo cual es correcto.

### 18.5 Rollback

No hay migration que revertir (el esquema se sincroniza solo). Si algo sale mal, recrear la base de datos o dropear la tabla `progreso_materia` y reiniciar el backend.

---

## Resumen de archivos modificados

| # | Archivo | Cambio |
|---|---|---|
| 1 | `backend/src/modules/progreso/entities/progreso-materia.entity.ts` | FK → Usuario, Unique |
| 2 | `backend/src/modules/usuarios/entities/usuario.entity.ts` | +OneToMany progresos |
| 3 | `backend/src/modules/carreras/entities/usuario-carrera.entity.ts` | -OneToMany progresos |
| 4 | `backend/src/modules/progreso/progreso.service.ts` | 4 métodos modificados |
| 5 | `backend/src/modules/carreras/carreras.service.ts` | obtenerPlanEstudios + quitarMateriaDelPlan |
| 6 | `backend/src/modules/planificacion/planificacion.service.ts` | 4 queries por usuarioId |
| 7 | `backend/src/modules/progreso/dto/actualizar-progreso.dto.ts` | +carreraId |
| 8 | `backend/src/modules/progreso/progreso.module.ts` | (opcional) +Usuario en forFeature |
| 9 | `backend/src/modules/estadisticas/estadisticas.service.ts` | 3 métodos modificados |
| 10 | `frontend/src/services/progreso.service.ts` | +carreraId en actualizar |
| 11 | `frontend/src/hooks/useProgreso.ts` | +carreraId param, invalidación global, fix auto-init |
| 12 | `frontend/src/pages/ProgresoPage.tsx` | Pasar carreraId al hook |
| 13 | `frontend/src/types/progreso.types.ts` | +carreraId en DTO |
