# Progreso compartido entre carreras

## Problema

Actualmente `ProgresoMateria` tiene `UNIQUE(usuario_carrera_id, materia_id)`, lo que ata el progreso a una inscripción específica. Si una misma materia existe en dos carreras distintas, el usuario debe registrar el progreso dos veces.

## Solución

Cambiar la FK de `usuario_carrera_id` → `usuario_id` y la unique a `UNIQUE(usuario_id, materia_id)`. El progreso pasa a ser del usuario sobre la materia, independientemente de la carrera desde la que se accede.

---

## 1. Base de datos — Migration

### 1.1 Crear migration

```bash
cd backend
npx typeorm migration:create src/migrations/SharedProgreso
```

### 1.2 SQL de la migration

**up:**

```sql
-- 1) Crear columna temporal usuario_id
ALTER TABLE progreso_materia
  ADD COLUMN usuario_id INT NULL AFTER progreso_id;

-- 2) Poblar usuario_id desde usuario_carrera
UPDATE progreso_materia pm
JOIN usuario_carrera uc ON uc.usuario_carrera_id = pm.usuario_carrera_id
SET pm.usuario_id = uc.usuario_id;

-- 3) Manejar duplicados: si un mismo (usuario_id, materia_id) aparece en
--    múltiples carreras, conservar la fila con estado más avanzado:
--    Completada > En Proceso > Pendiente. A igual estado, la de mayor nota.
--    Eliminar las filas sobrantes.
DELETE pm2 FROM progreso_materia pm2
INNER JOIN (
    SELECT pm.usuario_id, pm.materia_id, MAX(pm.progreso_id) AS keep_id
    FROM progreso_materia pm
    INNER JOIN (
        SELECT usuario_id, materia_id,
            CASE
                WHEN SUM(CASE WHEN e.nombre = 'Completada' THEN 3
                              WHEN e.nombre = 'En Proceso' THEN 2
                              ELSE 1 END) >= 3 THEN 'Completada'
                WHEN SUM(CASE WHEN e.nombre = 'Completada' THEN 3
                              WHEN e.nombre = 'En Proceso' THEN 2
                              ELSE 1 END) >= 2 THEN 'En Proceso'
                ELSE 'Pendiente'
            END AS mejor_estado,
            MAX(pm.nota) AS mejor_nota
        FROM progreso_materia pm
        JOIN estado_materia e ON e.estado_id = pm.estado_id
        GROUP BY pm.usuario_id, pm.materia_id
    ) mejor ON mejor.usuario_id = pm2.usuario_id AND mejor.materia_id = pm2.materia_id
    JOIN estado_materia e2 ON e2.estado_id = pm2.estado_id
    LEFT JOIN (
        SELECT pm3.progreso_id
        FROM progreso_materia pm3
        JOIN estado_materia e3 ON e3.estado_id = pm3.estado_id
        INNER JOIN (
            SELECT usuario_id, materia_id,
                CASE
                    WHEN SUM(CASE WHEN e3.nombre = 'Completada' THEN 3
                                  WHEN e3.nombre = 'En Proceso' THEN 2
                                  ELSE 1 END) >= 3 THEN 'Completada'
                    WHEN SUM(CASE WHEN e3.nombre = 'Completada' THEN 3
                                  WHEN e3.nombre = 'En Proceso' THEN 2
                                  ELSE 1 END) >= 2 THEN 'En Proceso'
                    ELSE 'Pendiente'
                END AS mejor_estado,
                MAX(pm3.nota) AS mejor_nota
            FROM progreso_materia pm3
            JOIN estado_materia e3 ON e3.estado_id = pm3.estado_id
            GROUP BY pm3.usuario_id, pm3.materia_id
        ) sub ON sub.usuario_id = pm3.usuario_id AND sub.materia_id = pm3.materia_id
        JOIN estado_materia e4 ON e4.estado_id = pm3.estado_id
        WHERE (e4.nombre = sub.mejor_estado)
          AND (pm3.nota = sub.mejor_nota OR (pm3.nota IS NULL AND sub.mejor_nota IS NULL))
        GROUP BY pm3.usuario_id, pm3.materia_id
        HAVING MIN(pm3.progreso_id) = pm3.progreso_id
    ) keep ON keep.progreso_id = pm2.progreso_id
WHERE keep.progreso_id IS NULL
  AND pm2.usuario_id IS NOT NULL;

-- 4) Hacer NOT NULL
ALTER TABLE progreso_materia
  MODIFY COLUMN usuario_id INT NOT NULL;

-- 5) Eliminar FK y columna vieja
ALTER TABLE progreso_materia
  DROP FOREIGN KEY progreso_materia_ibfk_1,
  DROP INDEX usuario_carrera_id,
  DROP COLUMN usuario_carrera_id;

-- 6) Agregar nueva FK e índice unique
ALTER TABLE progreso_materia
  ADD CONSTRAINT fk_progreso_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id) ON DELETE CASCADE,
  ADD UNIQUE INDEX uq_usuario_materia (usuario_id, materia_id);
```

> **Alternativa simplificada** si no hay datos reales o se acepta perder duplicados:
> ```sql
> DELETE pm FROM progreso_materia pm
> WHERE pm.progreso_id NOT IN (
>   SELECT MIN(progreso_id) FROM progreso_materia
>   GROUP BY usuario_id, materia_id
> );
> ```
> y luego seguir con los pasos 1, 2, 4, 5, 6.

**down:**

```sql
ALTER TABLE progreso_materia
  DROP FOREIGN KEY fk_progreso_usuario,
  DROP INDEX uq_usuario_materia;

ALTER TABLE progreso_materia
  ADD COLUMN usuario_carrera_id INT NULL AFTER progreso_id,
  ADD CONSTRAINT progreso_materia_ibfk_1
    FOREIGN KEY (usuario_carrera_id) REFERENCES usuario_carrera(usuario_carrera_id) ON DELETE CASCADE;

-- No se puede revertir la pérdida de datos duplicados
```

### 1.3 Ejecutar

```bash
npx typeorm migration:run -d src/config/typeorm.config.ts
```

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

### 5.2 `inicializar(dto)`

```typescript
// Obtener usuarioId desde la inscripción
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

**Implementación Opción A** — Agregar `carreraId` a `ActualizarProgresoDto`:

```typescript
// actualizar-progreso.dto.ts
@ApiProperty({ example: 1 })
@IsInt()
carreraId: number;
```

Y pasarlo al service. En el controlador, el frontend ya envía `carreraId` (se obtiene de `carreraActiva.carrera.carreraId`).

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

---

## 6. Backend — DTO: `ActualizarProgresoDto`

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

---

## 7. Backend — Controller: `ProgresoController`

**Archivo:** `backend/src/modules/progreso/progreso.controller.ts`

No requiere cambios estructurales. Los endpoints reciben los mismos parámetros. Solo verificar que `actualizar` pase `carreraId` del DTO a `progresoService.actualizar()`.

---

## 8. Backend — Module: `ProgresoModule`

**Archivo:** `backend/src/modules/progreso/progreso.module.ts`

Agregar `Usuario` al `TypeOrmModule.forFeature`:

```typescript
import { Usuario } from '../usuarios/entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgresoMateria, EstadoMateria, UsuarioCarrera, CarreraMateria, Correlativa, Usuario,
    ]),
  ],
  // ...
})
```

---

## 9. Backend — Service: `EstadisticasService`

**Archivo:** `backend/src/modules/estadisticas/estadisticas.service.ts`

Todos los métodos que buscan progreso por `usuarioCarreraId` deben cambiar a buscar por `usuarioId`.

### 9.1 `obtenerResumen(usuarioCarreraId)`

```typescript
// Obtener usuarioId desde la inscripción
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

### 9.2 `obtenerDistribucionEstados(usuarioCarreraId)`

```typescript
// Antes:
const progresos = await this.progresoRepo.find({
  where: { usuarioCarrera: { usuarioCarreraId } },
  relations: { estado: true },
});

// Después:
const inscripcion = await this.usuarioCarreraRepo.findOne({
  where: { usuarioCarreraId },
  relations: { usuario: true },
});
if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

const progresos = await this.progresoRepo.find({
  where: { usuario: { usuarioId: inscripcion.usuario.usuarioId } },
  relations: { estado: true },
});
```

### 9.3 `obtenerEvolucion(usuarioCarreraId)`

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

## 10. Backend — Controller: `EstadisticasController`

**Archivo:** `backend/src/modules/estadisticas/estadisticas.controller.ts`

No requiere cambios. Los endpoints siguen recibiendo `usuarioCarreraId` y `usuarioId` según corresponda.

---

## 11. Frontend — API Service: `progreso.service.ts`

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

## 12. Frontend — Hook: `useProgreso.ts`

**Archivo:** `frontend/src/hooks/useProgreso.ts`

### 12.1 Recibir `carreraId` como parámetro

```typescript
export function useProgreso(usuarioCarreraId: number | null, carreraId?: number | null) {
```

### 12.2 Pasar `carreraId` en la mutation de actualización

```typescript
const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarProgresoDto }) =>
        progresoService.actualizarProgreso(id, data, carreraId!),
    // ...
});
```

### 12.3 Invalidar progreso de todas las carreras en vez de solo la actual

Al actualizar o eliminar, el progreso cambia globalmente (afecta a todas las carreras). Invalidar todas las queries relacionadas:

```typescript
onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['progreso'] }); // invalida TODAS las carreras
    queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
    addNotification('Progreso actualizado', 'success');
},
```

> Alternativa: invalidar solo las carreras del usuario (más preciso). Se puede obtener `usuarioId` del auth store y luego buscar todas las `usuarioCarreraId` activas para invalidar cada una. Pero invalidar `['progreso']` es más simple y React Query lo maneja eficientemente.

### 12.4 Auto-init

El auto-init actual verifica si `progresos.length > 0` para decidir si inicializar. Con progreso compartido, al entrar a una carrera nueva pueden venir materias con progreso (compartidas) y otras sin progreso (exclusivas). El auto-init se dispara si la lista está vacía, lo cual solo pasa si ninguna materia del plan tiene progreso. Esto sigue siendo correcto, pero se podría optimizar:

```typescript
// Opcional: inicializar siempre al entrar a una carrera nueva
// para asegurar que todas las materias del plan tengan registro.
// El backend ya ignora duplicados (skip-if-exists).
```

No es necesario cambiar la lógica de auto-init, el backend ya maneja duplicados correctamente.

---

## 13. Frontend — Page: `ProgresoPage.tsx`

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

## 14. Frontend — Types

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

## 15. Frontend — Componente `MateriaProgresoRow.tsx`

**Archivo:** `frontend/src/components/progreso/MateriaProgresoRow.tsx`

Si este componente usa `progresoId` para editar y muestra correlativas, verificar que al obtener detalle de materia se pase el `carreraId` correcto. El componente ya recibe `carreraId` como prop (revisar el código actual). No requiere cambios adicionales.

---

## 16. Consideraciones adicionales

### 16.1 Planificación de horarios

`MateriaPlanificada` NO referencia `ProgresoMateria`, solo referencia `Materia` y `PeriodoPlanificacion`. No requiere cambios.

### 16.2 Trayectorias

`Trayectoria` referencia `UsuarioCarrera`, no `ProgresoMateria`. No requiere cambios.

### 16.3 Dashboard / Estadísticas

Los endpoints de estadísticas (`/resumen`, `/distribucion-estados`, `/evolucion`) siguen recibiendo `usuarioCarreraId` y calculan sobre esa carrera específica, pero ahora el progreso considerado es el compartido del usuario. Esto es correcto porque:
- El promedio general se calcula sobre todas las materias completadas del usuario (incluyendo las de otras carreras).
- La distribución de estados se calcula solo sobre las materias del plan de la carrera actual.
- La evolución histórica usa las fechas de completado del usuario.

### 16.4 `carreras-resumen`

Ya usa `usuarioId` (no `usuarioCarreraId`). No requiere cambios. Internamente llama a `obtenerResumen` que ahora usará progreso compartido, lo cual es correcto.

### 16.5 Rollback

Si algo sale mal, la migration tiene `down` que revierte el schema, pero los datos duplicados eliminados no se recuperan. Se recomienda:
- Hacer backup de `progreso_materia` antes de migrar.
- Probar en ambiente de desarrollo primero.

---

## Resumen de archivos modificados

| # | Archivo | Cambio |
|---|---|---|
| 1 | `backend/src/migrations/...SharedProgreso.ts` | Migration SQL |
| 2 | `backend/src/modules/progreso/entities/progreso-materia.entity.ts` | FK → Usuario, Unique |
| 3 | `backend/src/modules/usuarios/entities/usuario.entity.ts` | +OneToMany progresos |
| 4 | `backend/src/modules/carreras/entities/usuario-carrera.entity.ts` | -OneToMany progresos |
| 5 | `backend/src/modules/progreso/progreso.service.ts` | 4 métodos modificados |
| 6 | `backend/src/modules/progreso/dto/actualizar-progreso.dto.ts` | +carreraId |
| 7 | `backend/src/modules/progreso/progreso.module.ts` | +Usuario en forFeature |
| 8 | `backend/src/modules/estadisticas/estadisticas.service.ts` | 3 métodos modificados |
| 9 | `frontend/src/services/progreso.service.ts` | +carreraId en actualizar |
| 10 | `frontend/src/hooks/useProgreso.ts` | +carreraId param, invalidación global |
| 11 | `frontend/src/pages/ProgresoPage.tsx` | Pasar carreraId al hook |
| 12 | `frontend/src/types/progreso.types.ts` | +carreraId en DTO |
