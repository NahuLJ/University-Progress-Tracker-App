# Edición de Posición de Materias en el Plan de Estudios — Documento de Implementación

## 1. Resumen del requerimiento

El `PlanEstudiosEditor` en la página de edición de carrera actualmente solo permite **agregar** y **quitar** materias del plan. Se requiere agregar la capacidad de **editar** el `anio`, `cuatrimestre` y `orden` (nro) de cada materia ya en el plan, mediante un **modal** de edición.

Al editar estos campos se deben validar tres reglas:

1. **Orden único**: el nuevo `orden` no debe estar en uso por otra materia en la misma carrera (sin importar año ni cuatrimestre).
2. **Correlativas de periodos anteriores**: si se cambia `anio` y/o `cuatrimestre`, todas las correlativas de la materia (`correlativasRequeridas`) deben pertenecer a periodos **estrictamente anteriores** al nuevo `anio`/`cuatrimestre`. Ninguna correlativa puede pertenecer al mismo o un periodo posterior. Esta misma validación se aplica al agregar una materia, pero ahora también aplica al editar.
3. **Materias dependientes en periodos posteriores (lógica inversa)**: si se mueve la materia hacia adelante, todas las materias que la requieren como correlativa (`esCorrelativaDe`) deben pertenecer a periodos **estrictamente posteriores** al nuevo `anio`/`cuatrimestre`. Ninguna dependiente puede estar en el mismo o un periodo anterior.

Si hay conflictos, deben aparecer los errores en un **modal** en el frontend.

Además, en el frontend se validan los valores numéricos antes de enviar (tanto al agregar como al editar): `anio` y `nro` deben ser enteros **mayores que 0**, y `cuatrimestre` debe ser **1 o 2**.

---

## 2. Archivos a modificar

### Backend

| Archivo | Tipo de cambio |
|---|---|
| `backend/src/modules/carreras/entities/carrera-materia.entity.ts` | **Modificado** — cambiar unique de `['carrera', 'anio', 'cuatrimestre', 'orden']` a `['carrera', 'orden']` |
| `backend/src/modules/carreras/dto/actualizar-materia-plan.dto.ts` | **Nuevo** — DTO para actualizar la posición de una materia en el plan |
| `backend/src/modules/carreras/carreras.service.ts` | **Modificado** — actualizar validación de `agregarMateriaAlPlan` (orden único en toda la carrera + validación de correlativas de periodos anteriores) y agregar método `actualizarMateriaEnPlan` con validaciones |
| `backend/src/modules/carreras/carreras.controller.ts` | **Modificado** — agregar endpoint `PUT /:id/materias/:carreraMateriaId` |
| `backend/src/modules/carreras/carreras.module.ts` | **Sin cambios** (ya importa todo lo necesario) |

### Frontend

| Archivo | Tipo de cambio |
|---|---|
| `frontend/src/components/admin/PlanEstudiosEditor.tsx` | **Modificado** — modal de edición de posición, modal de errores de validación, validación de números |
| `frontend/src/services/carreras.service.ts` | **Modificado** — agregar función `actualizarMateriaEnPlan` |
| `frontend/src/types/carrera.types.ts` | **Modificado** — agregar tipo `ActualizarMateriaPlanDto` |

---

## 3. Backend

### 3.1 Nuevo DTO: `ActualizarMateriaPlanDto`

**Archivo**: `backend/src/modules/carreras/dto/actualizar-materia-plan.dto.ts`

```typescript
import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActualizarMateriaPlanDto {
  @ApiProperty({ example: 2, description: 'Nuevo año (opcional, al menos un campo requerido)' })
  @IsInt()
  @Min(1)
  @Max(10)
  anio?: number;

  @ApiProperty({ example: 1, description: 'Nuevo cuatrimestre (opcional, al menos un campo requerido)' })
  @IsInt()
  @Min(1)
  @Max(3)
  cuatrimestre?: number;

  @ApiProperty({ example: 3, description: 'Nuevo orden/nro dentro del cuatrimestre (opcional, al menos un campo requerido)' })
  @IsInt()
  @Min(1)
  orden?: number;
}
```

> Al menos uno de los tres campos debe ser proporcionado. Esta validación se implementa en el service (no en el DTO, ya que `class-validator` no soporta "al menos uno de" de forma nativa sin custom validation).

### 3.2 Nuevo endpoint en `CarrerasController`

**Archivo**: `backend/src/modules/carreras/carreras.controller.ts`

Agregar el siguiente método junto a los existentes (`agregarMateria`, `quitarMateria`):

```typescript
@Put(':id/materias/:carreraMateriaId')
@ApiBearerAuth()
@ApiOperation({ summary: 'Actualizar la posición de una materia en el plan de estudios' })
@ApiResponse({ status: 200, description: 'Materia actualizada en el plan' })
@ApiResponse({ status: 400, description: 'Error de validación (orden duplicado, correlativas inválidas, etc.)' })
@ApiResponse({ status: 404, description: 'Carrera o registro del plan no encontrado' })
async actualizarMateriaEnPlan(
  @Param('id') id: number,
  @Param('carreraMateriaId') carreraMateriaId: number,
  @Body() dto: ActualizarMateriaPlanDto,
) {
  return this.carrerasService.actualizarMateriaEnPlan(id, carreraMateriaId, dto);
}
```

### 3.3 Lógica de validación en `CarrerasService`

**Archivo**: `backend/src/modules/carreras/carreras.service.ts`

#### 3.3.1 Método `actualizarMateriaEnPlan`

```typescript
async actualizarMateriaEnPlan(
  carreraId: number,
  carreraMateriaId: number,
  dto: ActualizarMateriaPlanDto,
): Promise<CarreraMateria> {
  const entry = await this.carreraMateriaRepo.findOne({
    where: { carreraMateriaId, carrera: { carreraId } },
    relations: {
      materia: {
        correlativasRequeridas: { materiaCorrelativa: true, carrera: true },
        esCorrelativaDe: { materia: true, carrera: true },
      },
    },
  });
  if (!entry) throw new NotFoundException('Registro del plan no encontrado');

  if (dto.anio == null && dto.cuatrimestre == null && dto.orden == null) {
    throw new BadRequestException('Al menos un campo (anio, cuatrimestre u orden) debe ser proporcionado');
  }

  const nuevoAnio = dto.anio ?? entry.anio;
  const nuevoCuatrimestre = dto.cuatrimestre ?? entry.cuatrimestre;
  const nuevoOrden = dto.orden ?? entry.orden;

  // Validación 1: orden único en toda la carrera
  const conflictoOrden = await this.carreraMateriaRepo.findOne({
    where: {
      carrera: { carreraId },
      orden: nuevoOrden,
    },
  });
  if (conflictoOrden && conflictoOrden.carreraMateriaId !== carreraMateriaId) {
    throw new BadRequestException(
      `Ya existe una materia con el orden ${nuevoOrden} en el plan de esta carrera`,
    );
  }

  // Validación 2: correlativas deben pertenecer a periodos anteriores
  const correlativas = entry.materia.correlativasRequeridas ?? [];
  const correlativasConPeriodo = correlativas.filter(
    (c) => !c.carrera || c.carrera.carreraId === carreraId,
  );

  for (const correlativa of correlativasConPeriodo) {
    const cmCorrelativa = await this.carreraMateriaRepo.findOne({
      where: {
        carrera: { carreraId },
        materia: { materiaId: correlativa.materiaCorrelativa.materiaId },
      },
    });
    if (!cmCorrelativa) continue;

    const esPeriodoPosterior =
      cmCorrelativa.anio > nuevoAnio ||
      (cmCorrelativa.anio === nuevoAnio && cmCorrelativa.cuatrimestre >= nuevoCuatrimestre);

    if (esPeriodoPosterior) {
      throw new BadRequestException(
        `La correlativa "${correlativa.materiaCorrelativa.nombre}" se cursa en el año ${cmCorrelativa.anio}, cuatrimestre ${cmCorrelativa.cuatrimestre}, ` +
          `que no es un periodo anterior al año ${nuevoAnio}, cuatrimestre ${nuevoCuatrimestre}`,
      );
    }
  }

  // Validación 3: materias que requieren esta materia como correlativa deben
  // estar en periodos posteriores al nuevo periodo
  const dependientes = entry.materia.esCorrelativaDe ?? [];
  const dependientesConPeriodo = dependientes.filter(
    (c) => !c.carrera || c.carrera.carreraId === carreraId,
  );

  for (const dependiente of dependientesConPeriodo) {
    const cmDependiente = await this.carreraMateriaRepo.findOne({
      where: {
        carrera: { carreraId },
        materia: { materiaId: dependiente.materia.materiaId },
      },
    });
    if (!cmDependiente) continue;

    const esPeriodoNoPosterior =
      cmDependiente.anio < nuevoAnio ||
      (cmDependiente.anio === nuevoAnio &&
        cmDependiente.cuatrimestre <= nuevoCuatrimestre);

    if (esPeriodoNoPosterior) {
      throw new BadRequestException(
        `La materia "${dependiente.materia.nombre}" depende de esta materia como correlativa y se cursa en el año ${cmDependiente.anio}, cuatrimestre ${cmDependiente.cuatrimestre}, ` +
          `que no es un periodo posterior al año ${nuevoAnio}, cuatrimestre ${nuevoCuatrimestre}`,
      );
    }
  }

  entry.anio = nuevoAnio;
  entry.cuatrimestre = nuevoCuatrimestre;
  entry.orden = nuevoOrden;

  return this.carreraMateriaRepo.save(entry);
}
```

#### 3.3.2 Lógica de validación de correlativas explicada

La regla es: al mover una materia a un nuevo `anio`/`cuatrimestre`, **todas** sus correlativas (definidas para esa carrera o globales) deben estar en periodos **estrictamente anteriores**.

Se considera "periodo anterior" si:
- El correlativo tiene `anio` menor, **o**
- El correlativo tiene el mismo `anio` pero `cuatrimestre` menor

Un correlativo en el **mismo** `anio`/`cuatrimestre` o en un periodo **posterior** genera un error de validación.

> Esta misma lógica se aplica cuando se agrega una materia al plan (validación añadida a `agregarMateriaAlPlan`) y ahora también cuando se edita la posición (nuevo método `actualizarMateriaEnPlan`).

#### 3.3.2b Lógica inversa: materias dependientes (`esCorrelativaDe`)

Al mover una materia **hacia adelante** (a un periodo más tardío), las materias que la requieren como correlativa (`esCorrelativaDe`) deben estar en periodos **estrictamente posteriores** al nuevo `anio`/`cuatrimestre`. Una dependiente en el **mismo** `anio`/`cuatrimestre` o en un periodo **anterior** genera un error de validación, porque quedaría como correlativa de una materia posterior a ella.

Se considera "periodo no posterior" (inválido) si:
- La dependiente tiene `anio` menor, **o**
- La dependiente tiene el mismo `anio` pero `cuatrimestre` menor o igual

#### 3.3.3 Lógica de validación de orden explicada

El `orden` (nro de materia) debe ser único en toda la carrera, sin importar el año ni cuatrimestre. Esto significa que no puede haber dos materias con el mismo `orden` en el mismo plan de carrera, aunque estén en diferentes años o cuatrimestres.

La validación se aplica tanto al **agregar** como al **editar** una materia en el plan.

---

## 4. Frontend

### 4.1 Modificaciones en `PlanEstudiosEditor.tsx`

El componente pasa de mostrar los campos `anio`, `cuatrimestre` y `orden` como solo lectura a permitir **editar la posición desde un modal** que se abre con el botón de lápiz por fila.

#### 4.1.1 Nuevo estado

Agregar al estado del componente:

```typescript
const [editandoMateria, setEditandoMateria] = useState<MateriaPlanEstudios | null>(null);
const [editForm, setEditForm] = useState({ anio: 1, cuatrimestre: 1, orden: 1 });
const [editErrors, setEditErrors] = useState<string[]>([]);
const [editErrorOpen, setEditErrorOpen] = useState(false);
```

#### 4.1.2 Mutación de actualización

Agregar un `useMutation` para llamar al nuevo endpoint:

```typescript
const actualizarMutation = useMutation({
  mutationFn: (data: { carreraMateriaId: number; dto: ActualizarMateriaPlanDto }) =>
    carrerasService.actualizarMateriaEnPlan(carreraId, data.carreraMateriaId, data.dto),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['plan-estudios', carreraId] });
    queryClient.invalidateQueries({ queryKey: ['plan-estudios'] });
    queryClient.invalidateQueries({ queryKey: ['carreras', 'admin'] });
    queryClient.invalidateQueries({ queryKey: ['materias', 'admin'] });
    queryClient.invalidateQueries({ queryKey: ['progreso'] });
    queryClient.invalidateQueries({ queryKey: ['planificacion'] });
    setEditandoMateria(null);
    setEditErrors([]);
    setEditErrorOpen(false);
    addNotification('Materia actualizada en el plan', 'success');
  },
  onError: (error) => {
    const messages = (error as any)?.response?.data?.message;
    if (Array.isArray(messages)) {
      setEditErrors(messages);
    } else {
      setEditErrors([messages || 'Error al actualizar la materia en el plan']);
    }
    setEditErrorOpen(true);
  },
});
```

#### 4.1.3 Fila de materia en el listado

Cada materia se muestra en modo lectura: `{orden} - {nombre}` + badge de código (no se muestra
"A{m.anio} C{m.cuatrimestre}" porque ya está agrupada por año y cuatrimestre). El botón de lápiz
abre el modal de edición y el de papelera abre el modal de confirmación para quitar.

```tsx
<li key={m.carreraMateriaId} className="flex items-center justify-between bg-base-700/60 rounded-lg px-3 py-2">
  <span className="text-sm text-slate-200">
    <span className="font-mono text-slate-400">{m.orden}</span>
    <span className="mx-1 text-slate-500">-</span>
    {m.nombre}
    <Badge variant="info" size="sm" className="ml-2">{m.codigo}</Badge>
  </span>
  <div className="flex items-center gap-2">
    <button
      title="Editar posición"
      onClick={() => { setEditandoMateria(m); setEditForm({ anio: m.anio, cuatrimestre: m.cuatrimestre, orden: m.orden }); }}
      className="text-slate-400 hover:text-neon-cyan transition-colors"
    >
      <Icon name="edit" className="w-4 h-4" />
    </button>
    <button title="Quitar del plan" onClick={() => setQuitarConfirm({ carreraMateriaId: m.carreraMateriaId, nombre: m.nombre, codigo: m.codigo, orden: m.orden })} className="text-slate-400 hover:text-neon-red transition-colors ml-3">
      <Icon name="delete" className="w-4 h-4" />
    </button>
  </div>
</li>
```

#### 4.1.3b Modal de edición de posición

Se agrega un `Modal` "Editar posición de la materia" que se abre cuando `editandoMateria` no es `null`. Muestra la materia seleccionada, los campos `Año` (min 1), `Cuatrimestre` (min 1, max 2) y `Nro` (min 1) **precargados** con sus valores actuales, y botones Cancelar / Guardar:

```tsx
<Modal isOpen={!!editandoMateria} onClose={onCancelarEdicion} title="Editar posición de la materia" size="md">
  {editandoMateria && (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap bg-base-700/60 rounded-lg px-3 py-2">
        <span className="text-sm text-slate-200">
          <span className="font-mono text-slate-400">{editandoMateria.orden}</span>
          <span className="mx-1 text-slate-500">-</span>
          {editandoMateria.nombre}
          <Badge variant="info" size="sm" className="ml-2">{editandoMateria.codigo}</Badge>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Año" type="number" min={1} max={10} value={editForm.anio} onChange={(e) => setEditForm({ ...editForm, anio: Number(e.target.value) })} />
        <Input label="Cuatrimestre" type="number" min={1} max={2} value={editForm.cuatrimestre} onChange={(e) => setEditForm({ ...editForm, cuatrimestre: Number(e.target.value) })} />
        <Input label="Nro" type="number" min={1} value={editForm.orden} onChange={(e) => setEditForm({ ...editForm, orden: Number(e.target.value) })} />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancelarEdicion}>Cancelar</Button>
        <Button onClick={() => onGuardarEdicion(editandoMateria.carreraMateriaId)} loading={actualizarMutation.isPending}>Guardar</Button>
      </div>
    </div>
  )}
</Modal>
```

#### 4.1.4 Función `onGuardarEdicion` y validación de números

```typescript
const validarPosicion = (pos: { anio: number; cuatrimestre: number; orden: number }): string | null => {
  if (!Number.isInteger(pos.anio) || pos.anio <= 0) {
    return 'El año debe ser un número entero mayor que 0';
  }
  if (pos.cuatrimestre !== 1 && pos.cuatrimestre !== 2) {
    return 'El cuatrimestre debe ser 1 o 2';
  }
  if (!Number.isInteger(pos.orden) || pos.orden <= 0) {
    return 'El nro debe ser un número entero mayor que 0';
  }
  return null;
};

const onGuardarEdicion = (carreraMateriaId: number) => {
  const error = validarPosicion(editForm);
  if (error) {
    addNotification(error, 'error');
    return;
  }
  actualizarMutation.mutate({
    carreraMateriaId,
    dto: {
      anio: editForm.anio,
      cuatrimestre: editForm.cuatrimestre,
      orden: editForm.orden,
    },
  });
};
```

> La misma `validarPosicion` se aplica en `onAgregar` (modal "Agregar materia") antes de llamar a `agregarMateriaAlPlan`.

#### 4.1.5 Modal de errores de validación

Agregar un `Modal` que se abra cuando `editErrorOpen` sea `true` y muestre la lista de errores. El texto de error usa `text-justify` para mantener el formato justificado:

```tsx
<Modal
  isOpen={editErrorOpen}
  onClose={() => { setEditErrorOpen(false); setEditErrors([]); }}
  title="Errores de validación"
  size="sm"
>
  <div className="space-y-3">
    <div className="bg-neon-red/10 border border-neon-red/30 rounded-lg p-3">
      <p className="text-sm text-neon-red font-medium text-justify">No se pudo actualizar la materia</p>
      <ul className="mt-2 text-sm text-slate-300 list-disc list-inside space-y-1 text-justify">
        {editErrors.map((err, i) => (
          <li key={i}>{err}</li>
        ))}
      </ul>
    </div>
    <div className="flex justify-end pt-2">
      <Button variant="ghost" onClick={() => { setEditErrorOpen(false); setEditErrors([]); }}>
        Cerrar
      </Button>
    </div>
  </div>
</Modal>
```

### 4.2 Servicio: agregar `actualizarMateriaEnPlan`

**Archivo**: `frontend/src/services/carreras.service.ts`

Agregar la siguiente función al objeto `carrerasService`:

```typescript
async actualizarMateriaEnPlan(carreraId: number, carreraMateriaId: number, dto: ActualizarMateriaPlanDto): Promise<void> {
  await api.put(`/carreras/${carreraId}/materias/${carreraMateriaId}`, dto);
},
```

### 4.3 Tipos: agregar `ActualizarMateriaPlanDto`

**Archivo**: `frontend/src/types/carrera.types.ts`

Agregar al final del archivo:

```typescript
export interface ActualizarMateriaPlanDto {
  anio?: number;
  cuatrimestre?: number;
  orden?: number;
}
```

Y actualizar la importación en `PlanEstudiosEditor.tsx` para incluir `ActualizarMateriaPlanDto`.

---

## 5. Resumen de validaciones

### Validación 1: Orden único en la carrera

| Condición | Resultado |
|---|---|
| `orden` ya existe para otro `carreraMateriaId` en la misma carrera | ❌ Error: `BadRequestException` |
| `orden` es el mismo que el actual (sin cambio de posición) | ✅ Permitido |
| `orden` no existe en ninguna materia de la carrera | ✅ Permitido |

### Validación 2: Correlativas en periodos anteriores

| Condición | Resultado |
|---|---|
| Todas las correlativas tienen `anio` < nuevo `anio` | ✅ Permitido |
| Correlativa tiene `anio` = nuevo `anio` pero `cuatrimestre` < nuevo `cuatrimestre` | ✅ Permitido |
| Correlativa tiene `anio` = nuevo `anio` y `cuatrimestre` = nuevo `cuatrimestre` | ❌ Error |
| Correlativa tiene `anio` > nuevo `anio` | ❌ Error |
| Correlativa tiene `anio` = nuevo `anio` pero `cuatrimestre` > nuevo `cuatrimestre` | ❌ Error |
| La materia no tiene correlativas | ✅ Permitido |

> **Nota**: La validación de correlativas se aplica tanto al **agregar** como al **editar** una materia en el plan. Al agregar, el periodo destino es el `anio`/`cuatrimestre` proporcionado en el formulario de agregar. Al editar, el periodo destino es el nuevo `anio`/`cuatrimestre` después del cambio.

### Validación 3: Materias dependientes (`esCorrelativaDe`) en periodos posteriores

| Condición | Resultado |
|---|---|
| Todas las dependientes tienen `anio` > nuevo `anio` | ✅ Permitido |
| Dependiente tiene `anio` = nuevo `anio` pero `cuatrimestre` > nuevo `cuatrimestre` | ✅ Permitido |
| Dependiente tiene `anio` = nuevo `anio` y `cuatrimestre` = nuevo `cuatrimestre` | ❌ Error |
| Dependiente tiene `anio` < nuevo `anio` | ❌ Error |
| Dependiente tiene `anio` = nuevo `anio` pero `cuatrimestre` < nuevo `cuatrimestre` | ❌ Error |
| Ninguna materia depende de esta | ✅ Permitido |

### Validación 4: Números válidos (frontend, agregar y editar)

| Campo | Regla |
|---|---|
| `anio` | Entero > 0 |
| `cuatrimestre` | Solo 1 o 2 |
| `orden` (nro) | Entero > 0 |

---

## 6. Checklist de implementación

### Backend

- [x] Crear `backend/src/modules/carreras/dto/actualizar-materia-plan.dto.ts`
- [x] Agregar método `actualizarMateriaEnPlan` a `CarrerasService` con las tres validaciones (orden único, correlativas anteriores, dependientes posteriores)
- [x] Agregar endpoint `PUT /carreras/:id/materias/:carreraMateriaId` a `CarrerasController`
- [x] Limitar `cuatrimestre` a 1–2 en `AgregarMateriaPlanDto` y `ActualizarMateriaPlanDto` (`@Max(2)`)

### Frontend

- [x] Agregar `ActualizarMateriaPlanDto` a `frontend/src/types/carrera.types.ts`
- [x] Agregar `actualizarMateriaEnPlan` a `carrerasService` en `frontend/src/services/carreras.service.ts`
- [x] Modificar `PlanEstudiosEditor.tsx`:
  - [x] Agregar estado `editandoMateria`, `editForm`, `editErrors`, `editErrorOpen`
  - [x] Agregar mutación `actualizarMutation`
  - [x] Agregar botón de edición (icono lápiz) por cada materia en el plan
  - [x] Agregar modal de edición con campos `anio`, `cuatrimestre`, `orden` precargados
  - [x] Agregar botones guardar/cancelar en el modal de edición
  - [x] Agregar modal de errores de validación
  - [x] Agregar validación de números (`validarPosicion`): año/nro > 0 y cuatrimestre 1–2, para agregar y editar
  - [x] Quitar el texto `A{anio} C{cuatrimestre}` de cada fila (redundante con la agrupación)
- [x] Verificar que `npm run lint` y `npm run build` pasen sin errores

### UI/UX

- [x] El botón de edición debe ser visible pero no dominante (usar icono con `text-slate-400` y hover `text-neon-cyan`)
- [x] Los campos de edición deben pre-poblar con los valores actuales al abrir el modal
- [x] El modal de errores debe listar cada error de validación con viñetas
- [x] El modal de errores debe tener un botón "Cerrar" para descartar los errores
- [x] El texto de error del modal debe estar justificado (`text-justify`)
- [x] El feedback de éxito debe usar el `addNotification` existente