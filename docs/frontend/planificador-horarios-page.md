# Página Planificador de Horarios — Especificación Técnica

## Estructura de Componentes

```
pages/
└── PlanificacionPage.tsx

components/planificacion/
├── PeriodoSelector.tsx               # Selector de año + instancia + nombre de planificación
├── NuevoPeriodoModal.tsx             # Modal para crear un nuevo período
├── CalendarioSemanal.tsx             # Grilla 7 bloques × 6 días
├── BloqueHorarioCelda.tsx            # Celda individual de 2h en la grilla (drop zone)
├── MateriaPlanificadaChip.tsx        # Chip de materia dentro de una celda (draggable)
├── MateriaDisponibleList.tsx         # Lista lateral de materias pendientes para arrastrar
├── MateriaDisponibleItem.tsx         # Ítem individual en la lista (draggable)
├── PlanificacionTabs.tsx             # Tabs para cambiar entre planificaciones del mismo usuario
├── VistaSemanalHeader.tsx            # Encabezado con los días de la semana
├── VistaHorariosHeader.tsx           # Encabezado lateral con los bloques horarios
├── LeyendaHorarios.tsx               # Leyenda de colores por materia
└── MateriasDesbloqueablesList.tsx    # Lista de materias que se desbloquearían al completar las planificadas

components/ui/
├── Card.tsx
├── Modal.tsx
├── Select.tsx
├── Button.tsx
├── Badge.tsx
├── Tabs.tsx
└── ScrollArea.tsx
```

### Árbol de Composición

```
MainLayout
└── PlanificacionPage
    ├── Header "Planificación de Horarios"
    │
    ├── Selector de carrera activa
    │
    ├── PlanificacionTabs
    │   ├── Tab por cada planificación del usuario (ej. "Variante A", "Variante B")
    │   └── Botón "+ Nueva planificación"
    │
    ├── PeriodoSelector
    │   ├── Select de año (e.j. 2026)
    │   ├── Select de instancia (Verano / 1er Cuatrimestre / 2do Cuatrimestre)
    │   └── Nombre de la planificación
    │
    ├── Contenedor principal (2 columnas)
    │   │
    │   ├── [Columna izquierda: 65%]
    │   │   └── CalendarioSemanal
    │   │       ├── VistaSemanalHeader (Lun | Mar | Mié | Jue | Vie | Sáb)
    │   │       │
    │   │       ├── Fila 08-10
    │   │       │   ├── BloqueHorarioCelda [Lun] → MateriaPlanificadaChip(s)
    │   │       │   ├── BloqueHorarioCelda [Mar] → MateriaPlanificadaChip(s)
    │   │       │   ├── BloqueHorarioCelda [Mié] → MateriaPlanificadaChip(s)
    │   │       │   ├── BloqueHorarioCelda [Jue] → MateriaPlanificadaChip(s)
    │   │       │   ├── BloqueHorarioCelda [Vie] → MateriaPlanificadaChip(s)
    │   │       │   └── BloqueHorarioCelda [Sáb] → MateriaPlanificadaChip(s)
    │   │       │
    │   │       ├── Fila 10-12
    │   │       │   └── ... (misma estructura)
    │   │       │
    │   │       ├── ... hasta Fila 20-22
    │   │       │
    │   │       └── LeyendaHorarios
    │   │
    │   └── [Columna derecha: 35%]
    │       └── MateriaDisponibleList
    │           ├── Título "Materias disponibles"
    │           ├── Input de búsqueda
    │           ├── MateriaDisponibleItem (draggable)
    │           │   └── Nombre + código + badge de créditos
    │           ├── MateriaDisponibleItem (...)
    │           └── EmptyState "No hay materias pendientes para planificar"
    │
    │
    ├── MateriasDesbloqueablesList
    │   ├── Título "Materias que se desbloquearán"
    │   ├── Subtítulo "Al completar las materias planificadas, también podrás cursar:"
    │   ├── MateriaDesbloqueableItem (no draggable)
    │   │   └── Nombre + código + badge de créditos
    │   ├── MateriaDesbloqueableItem (...)
    │   └── EmptyState "No hay materias nuevas por desbloquear"
    │
    └── Botones de acción
        ├── "Descartar cambios"
        └── "Guardar planificación"
```

---

## Manejo del Estado Local

### Store de Planificación (zustand)

```typescript
// store/planificacion.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface MateriaEnCelda {
    planificacionId: number;  // ID en la DB (si ya fue guardado)
    materiaId: number;
    nombre: string;
    codigo: string;
    creditos: number;
}

interface PlanificacionState {
    // Planificación activa
    periodoActivo: {
        periodoId: number | null;
        anio: number;
        instancia: string;
        nombre: string | null;
    } | null;

    // Mapa de celdas: key = "BLOQUE_ID-DIA" → MateriaEnCelda[]
    celdas: Record<string, MateriaEnCelda[]>;

    // Materias disponibles (pendientes, no planificadas)
    materiasDisponibles: MateriaEnCelda[];

    // Flag para saber si hay cambios sin guardar
    dirty: boolean;

    // Actions
    setPeriodoActivo: (periodo: PlanificacionState['periodoActivo']) => void;
    setCeldas: (celdas: Record<string, MateriaEnCelda[]>) => void;
    asignarMateria: (bloqueId: number, dia: string, materiaId: number) => void;
    quitarMateria: (bloqueId: number, dia: string, planificacionId: number) => void;
    setMateriasDisponibles: (materias: MateriaEnCelda[]) => void;
    marcarGuardado: () => void;
}

export const usePlanificacionStore = create<PlanificacionState>()(
    devtools(
        (set, get) => ({
            periodoActivo: null,
            celdas: {},
            materiasDisponibles: [],
            dirty: false,

            setPeriodoActivo: (periodo) => set({ periodoActivo: periodo }),

            setCeldas: (celdas) => set({ celdas, dirty: false }),

            asignarMateria: (bloqueId, dia, materiaId) => {
                const key = `${bloqueId}-${dia}`;
                const materia = get().materiasDisponibles.find((m) => m.materiaId === materiaId);
                if (!materia) return;

                const celdas = { ...get().celdas };
                if (!celdas[key]) celdas[key] = [];
                celdas[key] = [...celdas[key], { ...materia, planificacionId: 0 }]; // 0 = nuevo (sin guardar)

                const disponibles = get().materiasDisponibles.filter((m) => m.materiaId !== materiaId);

                set({ celdas, materiasDisponibles: disponibles, dirty: true });
            },

            quitarMateria: (bloqueId, dia, planificacionId) => {
                const key = `${bloqueId}-${dia}`;
                const celdas = { ...get().celdas };
                const materiaRemovida = celdas[key]?.find(
                    (m) => m.planificacionId === planificacionId,
                );

                celdas[key] = celdas[key]?.filter((m) => m.planificacionId !== planificacionId) ?? [];
                if (celdas[key].length === 0) delete celdas[key];

                const disponibles = materiaRemovida
                    ? [...get().materiasDisponibles, materiaRemovida]
                    : get().materiasDisponibles;

                set({ celdas, materiasDisponibles: disponibles, dirty: true });
            },

            setMateriasDisponibles: (materias) => set({ materiasDisponibles: materias }),

            marcarGuardado: () => set({ dirty: false }),
        }),
        { name: 'planificacion-store' },
    ),
);
```

### Hook Personalizado: `usePlanificacion`

```typescript
// hooks/usePlanificacion.ts
import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planificacionService } from '../services/planificacion.service';
import { usePlanificacionStore } from '../store/planificacion.store';
import { useProgreso } from './useProgreso';

export function usePlanificacion(usuarioCarreraId: number | null) {
    const queryClient = useQueryClient();
    const store = usePlanificacionStore();

    // Obtener períodos del usuario
    const { data: periodos, isLoading: periodosLoading } = useQuery({
        queryKey: ['planificacion', 'periodos', usuarioCarreraId],
        queryFn: () => planificacionService.listarPeriodos(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    // Obtener materias pendientes (no completadas) para la lista disponible
    const { data: progreso } = useProgreso(usuarioCarreraId);

    useEffect(() => {
        if (progreso) {
            const pendientes = progreso
                .filter((p) => p.estado.nombre !== 'Completada')
                .map((p) => ({
                    planificacionId: 0,
                    materiaId: p.materia.materiaId,
                    nombre: p.materia.nombre,
                    codigo: p.materia.codigo,
                    creditos: p.materia.creditos,
                }));
            store.setMateriasDisponibles(pendientes);
        }
    }, [progreso]);

    // Obtener materias que se desbloquearían al completar las planificadas
    const { data: materiasDesbloqueables } = useQuery({
        queryKey: ['planificacion', 'materias-desbloqueables', store.periodoActivo?.periodoId],
        queryFn: () =>
            planificacionService.obtenerMateriasDesbloqueables(store.periodoActivo!.periodoId),
        enabled: !!store.periodoActivo?.periodoId,
    });

    const materiasDesbloqueablesData = materiasDesbloqueables ?? [];

    // Cuando se selecciona un período, cargar sus materias planificadas
    const cargarPeriodo = useCallback(async (periodoId: number) => {
        const materias = await planificacionService.obtenerMateriasDelPeriodo(periodoId);
        const celdas: Record<string, any[]> = {};
        const planificadas: any[] = [];

        for (const mp of materias) {
            const key = `${mp.bloque.bloqueId}-${mp.diaSemana}`;
            if (!celdas[key]) celdas[key] = [];
            celdas[key].push({
                planificacionId: mp.planificacionId,
                materiaId: mp.materia.materiaId,
                nombre: mp.materia.nombre,
                codigo: mp.materia.codigo,
                creditos: mp.materia.creditos,
            });
            planificadas.push(mp.materia.materiaId);
        }

        store.setCeldas(celdas);

        // Remover de disponibles las que ya están planificadas
        const disponibles = store.materiasDisponibles.filter(
            (m) => !planificadas.includes(m.materiaId),
        );
        store.setMateriasDisponibles(disponibles);
    }, []);

    const crearPeriodoMutation = useMutation({
        mutationFn: (data: any) => planificacionService.crearPeriodo(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['planificacion', 'periodos', usuarioCarreraId] });
        },
    });

    const guardarMutation = useMutation({
        mutationFn: async (periodoId: number) => {
            const state = usePlanificacionStore.getState();
            // Enviar todas las asignaciones al backend
            const asignaciones = Object.entries(state.celdas).flatMap(([key, materias]) => {
                const [bloqueId, diaSemana] = key.split('-');
                return materias
                    .filter((m) => m.planificacionId === 0) // Solo nuevas
                    .map((m) => ({
                        periodoId,
                        materiaId: m.materiaId,
                        bloqueId: parseInt(bloqueId),
                        diaSemana,
                    }));
            });
            await planificacionService.guardarAsignaciones(periodoId, asignaciones);
        },
        onSuccess: () => {
            store.marcarGuardado();
            queryClient.invalidateQueries({ queryKey: ['planificacion'] });
        },
    });

    return {
        periodos,
        periodosLoading,
        crearPeriodo: crearPeriodoMutation,
        guardar: guardarMutation,
        cargarPeriodo,
        materiasDesbloqueables: materiasDesbloqueablesData,
        store,
    };
}
```

---

## Comportamiento UX/UI

### CalendarioSemanal — Vista Principal

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Planificación — 1° Cuatrimestre 2026  [Variante A]    [Guardar] [Descartar]           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│          │   Lunes    │   Martes   │  Miércoles  │   Jueves   │  Viernes   │  Sábado   │
│──────────┼────────────┼────────────┼─────────────┼────────────┼────────────┼───────────│
│  08-10   │            │            │             │            │            │           │
│          │  [Álgebra] │            │  [Program.] │            │  [Inglés]  │           │
│──────────┼────────────┼────────────┼─────────────┼────────────┼────────────┼───────────│
│  10-12   │            │            │             │            │            │           │
│          │  [Cálculo] │  [Física]  │             │  [Álgebra] │            │           │
│──────────┼────────────┼────────────┼─────────────┼────────────┼────────────┼───────────│
│  12-14   │            │            │             │            │            │           │
│          │            │            │   [Libre]   │            │            │           │
│──────────┼────────────┼────────────┼─────────────┼────────────┼────────────┼───────────│
│  14-16   │            │            │             │            │            │           │
│          │  [BDatos]  │            │  [BDatos]   │            │  [Física]  │           │
│──────────┼────────────┼────────────┼─────────────┼────────────┼────────────┼───────────│
│  16-18   │            │            │             │            │            │           │
│          │            │  [Mate.]   │             │            │            │           │
│──────────┼────────────┼────────────┼─────────────┼────────────┼────────────┼───────────│
│  18-20   │            │            │             │            │            │           │
│          │            │            │             │            │            │           │
│──────────┼────────────┼────────────┼─────────────┼────────────┼────────────┼───────────│
│  20-22   │            │            │             │            │            │           │
│          │            │            │             │            │            │           │
└──────────┴────────────┴────────────┴─────────────┴────────────┴────────────┴───────────┘
```

### Interacciones de Drag & Drop

| Acción | Comportamiento |
|---|---|
| Arrastrar materia desde "Disponibles" al calendario | La materia aparece como chip en la celda objetivo y se remueve de la lista disponible |
| Arrastrar materia de una celda a otra | Se mueve el chip entre celdas (requiere que la celda destino esté vacía o se hace swap) |
| Click en "X" del chip | Remueve la materia de la celda y la devuelve a la lista de disponibles |
| Hover sobre celda ocupada | Tooltip con nombre completo de la materia, código y créditos |
| Hover sobre celda vacía | Sutil borde punteado indicando que es una drop zone válida |
| Doble click en celda vacía | Abre modal rápido con lista filtrada de materias disponibles para asignar |

### NuevoPeriodoModal

```
┌──────────────────────────────────────────┐
│  ×  Nueva planificación                   │
│                                           │
│  Año:        [2026                  ]    │
│  Instancia:  [▼ 1er Cuatrimestre    ]    │
│  Nombre:     [Variante B            ]    │
│              (opcional, para distinguir)  │
│                                           │
│  [Cancelar]    [Crear planificación]      │
└──────────────────────────────────────────┘
```

### MateriaPlanificadaChip

```
┌──────────────────────┐
│  Álgebra      ×      │  ← color por materia (asignado dinámicamente)
│  MAT101 · 8 créd     │
└──────────────────────┘
```

Cada materia recibe un color único basado en su ID para identificarla visualmente en el calendario:

```typescript
const COLORES_MATERIAS = [
    'bg-blue-100 text-blue-800 border-blue-300',
    'bg-green-100 text-green-800 border-green-300',
    'bg-purple-100 text-purple-800 border-purple-300',
    'bg-orange-100 text-orange-800 border-orange-300',
    'bg-pink-100 text-pink-800 border-pink-300',
    'bg-teal-100 text-teal-800 border-teal-300',
    'bg-indigo-100 text-indigo-800 border-indigo-300',
];

function getColorMateria(materiaId: number): string {
    return COLORES_MATERIAS[materiaId % COLORES_MATERIAS.length];
}
```

### Validaciones

| Regla | Comportamiento |
|---|---|
| Una materia no puede estar en dos bloques distintos en el mismo período | Si se arrastra una materia ya asignada, se mueve (no se duplica) |
| No puede haber dos materias en la misma celda | La celda solo acepta una materia (si se arrastra otra, se rechaza con feedback visual rojo) |
| Solo materias pendientes aparecen en la lista disponible | Las completadas se filtran automáticamente |
| Materias desbloqueables se actualizan al cargar un período | Se fetchean de `GET /planificacion/periodos/:id/materias-desbloqueables` cuando `periodoActivo` cambia |
| Cambios sin guardar | El store marca `dirty = true`. Si se intenta cambiar de período sin guardar, aparece confirmación "Hay cambios sin guardar. ¿Descartarlos?" |
| Persistencia al recargar | El estado de planificación no persiste entre sesiones. Se guarda explícitamente con el botón "Guardar" |

### Estados de la Página

| Estado | Comportamiento |
|---|---|
| Sin períodos creados | EmptyState "No hay planificaciones. Creá una para comenzar" + botón "Nueva planificación" |
| Cargando período | Skeleton del calendario completo con celdas grises |
| Guardando | Botón "Guardar" muestra spinner y se deshabilita |
| Guardado exitoso | Toast verde "Planificación guardada correctamente" + store.dirty = false |
| Error al guardar | Toast rojo "Error al guardar: [mensaje]" |
| Sin materias pendientes en la carrera | Lista de disponibles vacía con mensaje "No hay materias pendientes para planificar" |
| Sin materias desbloqueables al cargar período | Lista de desbloqueables vacía con mensaje "No hay materias nuevas por desbloquear" |
| Conflicto de horario desde el backend | Toast rojo con el conflicto específico |
