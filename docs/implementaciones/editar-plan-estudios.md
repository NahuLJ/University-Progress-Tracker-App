# Edición de Posición de Materias en el Plan de Estudios — Documento de Implementación

## 1. Resumen del requerimiento

El `PlanEstudiosEditor` en la página de edición de carrera actualmente solo permite **agregar** y **quitar** materias del plan. Se requiere agregar la capacidad de **editar** el `anio`, `cuatrimestre` y `orden` (nro) de cada materia ya en el plan.

Al editar estos campos se deben validar dos reglas:

1. **Orden único**: el nuevo `orden` no debe estar en uso por otra materia en la misma carrera (sin importar año ni cuatrimestre).
2. **Correlativas de periodos anteriores**: si se cambia `anio` y/o `cuatrimestre`, todas las correlativas de la materia deben pertenecer a periodos **estrictamente anteriores** al nuevo `anio`/`cuatrimestre`. Ninguna correlativa puede pertenecer al mismo o un periodo posterior. Esta misma validación se aplica al agregar una materia, pero ahora también aplica al editar.

Si hay conflictos, deben aparecer los errores en un **modal** en el frontend.

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
| `frontend/src/components/admin/PlanEstudiosEditor.tsx` | **Modificado** — agregar modo edición inline, botón de guardar/cancelar, modal de errores |
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
    relations: { materia: { correlativasRequeridas: { materiaCorrelativa: true } } },
  });
  if (!entry) throw new NotFoundException('Registro del plan no encontrado');

  const nuevoAnio = dto.anio ?? entry.anio;
  const nuevoCuatrimestre = dto.cuatrimestre ?? entry.cuatrimestre;
  const nuevoOrden = dto.orden ?? entry.orden;

  if (dto.anio == null && dto.cuatrimestre == null && dto.orden == null) {
    throw new BadRequestException('Al menos un campo (anio, cuatrimestre u orden) debe ser proporcionado');
  }

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

#### 3.3.3 Lógica de validación de orden explicada

El `orden` (nro de materia) debe ser único en toda la carrera, sin importar el año ni cuatrimestre. Esto significa que no puede haber dos materias con el mismo `orden` en el mismo plan de carrera, aunque estén en diferentes años o cuatrimestres.

La validación se aplica tanto al **agregar** como al **editar** una materia en el plan.

---

## 4. Frontend

### 4.1 Modificaciones en `PlanEstudiosEditor.tsx`

El componente debe pasar de mostrar los campos `anio`, `cuatrimestre` y `orden` como solo lectura a hacerlos **editables inline** con un modo de edición por fila.

#### 4.1.1 Nuevo estado

Agregar al estado del componente:

```typescript
const [editandoId, setEditandoId] = useState<number | null>(null);
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
    setEditandoId(null);
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

#### 4.1.3 Fila editable en el listado de materias

En la renderización de cada materia dentro de `materiasEnPlan`, reemplazar la visualización estática de `anio`, `cuatrimestre` y `orden` con:

- **Modo lectura**: mostrar los valores actuales + un botón de edición (icono de lápiz)
- **Modo edición**: mostrar los campos `Input` numéricos para `anio`, `cuatrimestre` y `orden` + botones de guardar/cancelar

Estructura de cada ítem de materia:

```tsx
<li key={m.carreraMateriaId} className="flex items-center justify-between bg-base-700/60 rounded-lg px-3 py-2">
  {/* Columna izquierda: nombre + badge */}
  <span className="text-sm text-slate-200">
    {editandoId === m.carreraMateriaId ? (
      <div className="grid grid-cols-3 gap-2 items-center">
        <Input
          label="Año" type="number" min={1}
          value={editForm.anio}
          onChange={(e) => setEditForm({ ...editForm, anio: Number(e.target.value) })}
        />
        <Input
          label="Cuatrimestre" type="number" min={1} max={3}
          value={editForm.cuatrimestre}
          onChange={(e) => setEditForm({ ...editForm, cuatrimestre: Number(e.target.value) })}
        />
        <Input
          label="Nro" type="number" min={1}
          value={editForm.orden}
          onChange={(e) => setEditForm({ ...editForm, orden: Number(e.target.value) })}
        />
      </div>
    ) : (
      <>
        <span className="font-mono text-slate-400">{m.orden}</span>
        <span className="mx-1 text-slate-500">-</span>
        {m.nombre}
        <Badge variant="info" size="sm" className="ml-2">{m.codigo}</Badge>
        <span className="text-xs text-slate-500 ml-2">A{m.anio} C{m.cuatrimestre}</span>
      </>
    )}
  </span>

  {/* Columna derecha: acciones */}
  <div className="flex items-center gap-2">
    {editandoId === m.carreraMateriaId ? (
      <>
        <Button size="sm" variant="success" onClick={() => onGuardarEdicion(m.carreraMateriaId)} loading={actualizarMutation.isPending}>
          Guardar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setEditandoId(null); setEditErrors([]); }}>
          Cancelar
        </Button>
      </>
    ) : (
      <>
        <button title="Editar posición" onClick={() => { setEditandoId(m.carreraMateriaId); setEditForm({ anio: m.anio, cuatrimestre: m.cuatrimestre, orden: m.orden }); }} className="text-slate-400 hover:text-neon-cyan transition-colors">
          <Icon name="edit" className="w-4 h-4" />
        </button>
        <button title="Quitar del plan" onClick={() => setQuitarConfirm({ carreraMateriaId: m.carreraMateriaId, nombre: m.nombre, codigo: m.codigo, orden: m.orden })} className="text-slate-400 hover:text-neon-red transition-colors ml-3">
          <Icon name="delete" className="w-4 h-4" />
        </button>
      </>
    )}
  </div>
</li>
```

#### 4.1.4 Función `onGuardarEdicion`

```typescript
const onGuardarEdicion = (carreraMateriaId: number) => {
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

#### 4.1.5 Modal de errores de validación

Agregar un `Modal` que se abra cuando `editErrorOpen` sea `true` y muestre la lista de errores:

```tsx
<Modal
  isOpen={editErrorOpen}
  onClose={() => { setEditErrorOpen(false); setEditErrors([]); }}
  title="Errores de validación"
  size="sm"
>
  <div className="space-y-3">
    <div className="bg-neon-red/10 border border-neon-red/30 rounded-lg p-3">
      <p className="text-sm text-neon-red font-medium">No se pudo actualizar la materia</p>
      <ul className="mt-2 text-sm text-slate-300 list-disc list-inside space-y-1">
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

---

## 6. Checklist de implementación

### Backend

- [ ] Crear `backend/src/modules/carreras/dto/actualizar-materia-plan.dto.ts`
- [ ] Agregar método `actualizarMateriaEnPlan` a `CarrerasService` con las dos validaciones
- [ ] Agregar endpoint `PUT /carreras/:id/materias/:carreraMateriaId` a `CarrerasController`
- [ ] Registrar el DTO en el `CarrerasModule` si es necesario (ya se importa automáticamente por NestJS)

### Frontend

- [ ] Agregar `ActualizarMateriaPlanDto` a `frontend/src/types/carrera.types.ts`
- [ ] Agregar `actualizarMateriaEnPlan` a `carrerasService` en `frontend/src/services/carreras.service.ts`
- [ ] Modificar `PlanEstudiosEditor.tsx`:
  - [ ] Agregar estado `editandoId`, `editForm`, `editErrors`, `editErrorOpen`
  - [ ] Agregar mutación `actualizarMutation`
  - [ ] Agregar botón de edición (icono lápiz) por cada materia en el plan
  - [ ] Agregar modo edición inline con campos `anio`, `cuatrimestre`, `orden`
  - [ ] Agregar botones guardar/cancelar en modo edición
  - [ ] Agregar modal de errores de validación
- [ ] Verificar que `npm run lint` y `npm run build` pasen sin errores

### UI/UX

- [ ] El botón de edición debe ser visible pero no dominante (usar icono con `text-slate-400` y hover `text-neon-cyan`)
- [ ] Los campos de edición deben pre-poblar con los valores actuales al entrar en modo edición
- [ ] El modal de errores debe listar cada error de validación con viñetas
- [ ] El modal de errores debe tener un botón "Cerrar" para descartar los errores
- [ ] El feedback de éxito debe usar el `addNotification` existente