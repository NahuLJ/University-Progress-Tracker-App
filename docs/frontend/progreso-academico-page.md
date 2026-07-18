# Página Progreso Académico — Especificación Técnica

## Estructura de Componentes

```
pages/
└── ProgresoPage.tsx

components/progreso/
├── ProgresoGrid.tsx               # Grilla con todas las materias y su progreso
├── MateriaProgresoRow.tsx         # Fila individual con controles de estado/nota
├── FiltroEstado.tsx               # Filtros por estado (Pendiente/En Proceso/Completada)
├── FiltroBusqueda.tsx             # Búsqueda por nombre de materia
├── ProgresoStatsBar.tsx           # Barra con conteo rápido: 18 CP · 5 EP · 12 PTE
├── CompletarMateriaModal.tsx      # Modal que se abre al marcar "Completada"
├── ConfirmarCambioModal.tsx       # Confirmación antes de cambiar estado
└── ProgresoBulkActions.tsx        # Acciones masivas (ej. marcar varias como "En Proceso")

components/ui/
├── Select.tsx
├── Input.tsx
├── Modal.tsx
├── Badge.tsx
├── Button.tsx
└── ConfirmDialog.tsx
```

### Árbol de Composición

```
MainLayout
└── ProgresoPage
    ├── Header "Progreso Académico"
    ├── Selector de carrera activa (igual que en Dashboard)
    │
    ├── ProgresoStatsBar
    │   ├── Badge "18 Completadas" (verde)
    │   ├── Badge "5 En Proceso" (amarillo)
    │   └── Badge "12 Pendientes" (rojo)
    │
    ├── Barra de filtros
    │   ├── FiltroEstado (tabs o pills: Todas | Pendientes | En Proceso | Completadas)
    │   └── FiltroBusqueda (Input con búsqueda por nombre, debounce 300ms)
    │
    └── ProgresoGrid
        ├── Encabezados: # | Materia | Código | Créditos | Estado | Nota | Tipo | Acción
        │
        ├── MateriaProgresoRow
        │   ├── Nombre + código
        │   ├── Badge con estado actual
        │   ├── Select de estado (Pendiente / En Proceso / Completada)
        │   ├── [Input nota]      ← visible solo si estado = "Completada"
        │   ├── [Select tipo]     ← visible solo si estado = "Completada"
        │   └── Botón "Guardar"
        │
        ├── MateriaProgresoRow (...)
        └── ...
```

---

## Manejo del Estado Local

### Hook Personalizado: `useProgreso`

```typescript
// hooks/useProgreso.ts
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progresoService } from '../services/progreso.service';

export function useProgreso(usuarioCarreraId: number | null) {
    const [filtroEstado, setFiltroEstado] = useState<string>('todas');
    const [busqueda, setBusqueda] = useState('');

    const queryClient = useQueryClient();

    const { data: progresos, isLoading } = useQuery({
        queryKey: ['progreso', usuarioCarreraId],
        queryFn: () => progresoService.obtenerProgreso(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    const mutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: ActualizarProgresoDto }) =>
            progresoService.actualizarProgreso(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['progreso', usuarioCarreraId] });
            queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
        },
    });

    const progresosFiltrados = useMemo(() => {
        if (!progresos) return [];
        return progresos.filter((p) => {
            const coincideEstado = filtroEstado === 'todas' || p.estado.nombre === filtroEstado;
            const coincideBusqueda = p.materia.nombre.toLowerCase().includes(busqueda.toLowerCase());
            return coincideEstado && coincideBusqueda;
        });
    }, [progresos, filtroEstado, busqueda]);

    return {
        progresos: progresosFiltrados,
        totales: {
            completadas: progresos?.filter((p) => p.estado.nombre === 'Completada').length ?? 0,
            enProceso: progresos?.filter((p) => p.estado.nombre === 'En Proceso').length ?? 0,
            pendientes: progresos?.filter((p) => p.estado.nombre === 'Pendiente').length ?? 0,
        },
        filtroEstado,
        setFiltroEstado,
        busqueda,
        setBusqueda,
        actualizar: (id: number, data: ActualizarProgresoDto) => mutation.mutate({ id, data }),
        isLoading: isLoading || mutation.isPending,
    };
}
```

### Estado de Fila Individual (MateriaProgresoRow)

Cada fila maneja su propio estado local de formulario con `react-hook-form`, independiente del resto:

```typescript
// components/progreso/MateriaProgresoRow.tsx
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';

interface MateriaProgresoRowProps {
    materia: Materia;
    progreso: Progreso;
    onSave: (id: number, data: ActualizarProgresoDto) => void;
    isSaving: boolean;
}

export function MateriaProgresoRow({ materia, progreso, onSave, isSaving }: MateriaProgresoRowProps) {
    const [editando, setEditando] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const estadoAnterior = useRef(progreso.estado.nombre);

    const { register, handleSubmit, watch, reset } = useForm({
        defaultValues: {
            estado: progreso.estado.nombre,
            nota: progreso.nota ?? undefined,
            tipoAprobacion: progreso.tipoAprobacion ?? undefined,
        },
    });

    const estadoSeleccionado = watch('estado');

    // Si el usuario cambia a "Completada", abrir modal de nota obligatoria
    const onSubmit = (data: ActualizarProgresoDto) => {
        if (data.estado === 'Completada' && estadoAnterior.current !== 'Completada') {
            setMostrarConfirmacion(true);
            return;
        }
        onSave(progreso.progresoId, data);
        estadoAnterior.current = data.estado;
        setEditando(false);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-12 gap-2 items-center p-3 hover:bg-gray-50">
            <span className="col-span-3 font-medium">{materia.nombre}</span>
            <span className="col-span-2 text-gray-500">{materia.codigo}</span>
            <span className="col-span-1 text-center">{materia.creditos}</span>

            <div className="col-span-2">
                <select {...register('estado')}
                    onChange={() => setEditando(true)}
                    className={`w-full border rounded p-1 text-sm ${
                        estadoSeleccionado === 'Completada' ? 'border-green-400' :
                        estadoSeleccionado === 'En Proceso' ? 'border-yellow-400' : 'border-gray-300'
                    }`}
                >
                    <option value="Pendiente">🔴 Pendiente</option>
                    <option value="En Proceso">🟡 En Proceso</option>
                    <option value="Completada">🟢 Completada</option>
                </select>
            </div>

            {estadoSeleccionado === 'Completada' && (
                <>
                    <div className="col-span-1">
                        <input type="number" {...register('nota', { valueAsNumber: true })}
                            placeholder="4-10" min={4} max={10}
                            className="w-full border rounded p-1 text-sm text-center" />
                    </div>
                    <div className="col-span-2">
                        <select {...register('tipoAprobacion')} className="w-full border rounded p-1 text-sm">
                            <option value="">Tipo</option>
                            <option value="Final">Final</option>
                            <option value="Promocion">Promoción</option>
                        </select>
                    </div>
                </>
            )}

            {!estadoSeleccionado.startsWith('Completada') && (
                <div className="col-span-3" />
            )}

            <div className="col-span-1">
                {editando && (
                    <Button type="submit" size="sm" loading={isSaving}>Guardar</Button>
                )}
            </div>

            {/* Modal de confirmación para completar materia */}
            {mostrarConfirmacion && (
                <CompletarMateriaModal
                    materiaNombre={materia.nombre}
                    nota={watch('nota')}
                    tipoAprobacion={watch('tipoAprobacion')}
                    onConfirm={() => {
                        setMostrarConfirmacion(false);
                        onSave(progreso.progresoId, watch());
                        estadoAnterior.current = 'Completada';
                        setEditando(false);
                    }}
                    onCancel={() => {
                        setMostrarConfirmacion(false);
                        reset();
                    }}
                />
            )}
        </form>
    );
}
```

---

## Comportamiento UX/UI

### ProgresoGrid — Vista Principal

```
┌─────────────────────────────────────────────────────────────────────┐
│  Progreso Académico                              [Ing. en Sistemas] │
│                                                                     │
│  📊 18 Completadas  ·  5 En Proceso  ·  12 Pendientes              │
│                                                                     │
│  [Todas] [Pendientes] [En Proceso] [Completadas]   🔍 Buscar...    │
│                                                                     │
│  ┌──────┬────────────────────┬───────┬──────┬──────┬──────┬──────┐ │
│  │  #   │ Materia            │ Cód.  │ Crd  │ Estado  │Nota│Tipo │ │
│  ├──────┼────────────────────┼───────┼──────┼──────────┼────┼─────┤ │
│  │  1   │ Álgebra            │MAT101 │  8   │ [🟢 CP ▼]│  9 │Final│ │
│  │  2   │ Programación I     │PROG1  │  8   │ [🟡 EP ▼]│  - │  -  │ │
│  │  3   │ Inglés             │ING101 │  4   │ [🔴 PT ▼]│  - │  -  │ │
│  │  4   │ Cálculo I          │MAT201 │  8   │ [🟢 CP ▼]│  7 │Prom │ │
│  └──────┴────────────────────┴───────┴──────┴──────────┴────┴─────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### CompletarMateriaModal

```
┌──────────────────────────────────────────┐
│  ×  Completar materia                    │
│                                          │
│  Estás por marcar como completada:       │
│  "Álgebra Lineal"                        │
│                                          │
│  Para confirmar, completá los datos:     │
│                                          │
│  Nota (4-10):    [ 8               ]    │
│  Tipo:           [▼ Final          ]    │
│                                          │
│  [Cancelar]    [Confirmar y guardar]     │
└──────────────────────────────────────────┘
```

### ConfirmarCambioModal (al cambiar de "Completada" a otro estado)

```
┌──────────────────────────────────────────┐
│  ¿Eliminar calificación?                  │
│                                          │
│  Al cambiar el estado de "Completada"    │
│  a "En Proceso", se eliminará la nota    │
│  y el tipo de aprobación registrados.    │
│                                          │
│  [No, cancelar]    [Sí, eliminar]        │
└──────────────────────────────────────────┘
```

### Validaciones del Lado del Cliente

| Regla | Comportamiento |
|---|---|
| Estado "Completada" sin nota | Modal de confirmación + botón deshabilitado hasta completar |
| Nota fuera de rango (4-10) | Input con `min=4 max=10`, validación nativa + mensaje "La nota debe ser entre 4 y 10" |
| Tipo de aprobación faltante | Select sin opción por defecto, se valida antes de enviar |
| Sin cambios detectados | Botón "Guardar" oculto (solo aparece cuando se modifica el select de estado) |
| Error de correlativas del backend | Toast/Alert: "No se puede avanzar: correlativas pendientes: [MateriaA, MateriaB]" |
| Estado "Pendiente" → "En Proceso" | Cambio directo sin validación adicional de nota |
| Debounce en búsqueda | 300ms antes de filtrar para no saturar el render |

### Estados de la Página

| Estado | Comportamiento |
|---|---|
| Cargando (primera carga) | `Skeleton` con 10 filas simuladas |
| Cargando (cambio de carrera) | Spinner sobre la tabla existente (no reemplazo completo) |
| Error de red | `Alert` rojo "Error al cargar el progreso" + botón "Reintentar" |
| Sin progreso inicializado | Botón "Inicializar progreso" que crea todos los registros como Pendiente |
| Todas las materias completadas | Banner verde "🎉 Completaste todas las materias del plan de estudios" |
| Filtro sin resultados | `EmptyState` "No hay materias que coincidan con los filtros seleccionados" |
