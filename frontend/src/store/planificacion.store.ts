import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { MateriaEnCelda } from '../types/planificacion.types';

interface PeriodoActivo {
    periodoId: number | null;
    anio: number;
    instancia: string;
    nombre: string | null;
}

interface PlanificacionState {
    periodoActivo: PeriodoActivo | null;
    celdas: Record<string, MateriaEnCelda[]>;
    materiasDisponibles: MateriaEnCelda[];
    dirty: boolean;
    setPeriodoActivo: (periodo: PlanificacionState['periodoActivo']) => void;
    setCeldas: (celdas: Record<string, MateriaEnCelda[]>) => void;
    asignarMateria: (bloqueId: number, dia: string, materiaId: number) => void;
    quitarMateria: (bloqueId: number, dia: string, planificacionId: number) => void;
    setMateriasDisponibles: (materias: MateriaEnCelda[]) => void;
    marcarGuardado: () => void;
    limpiarStore: () => void;
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
                celdas[key] = [...celdas[key], { ...materia, planificacionId: 0 }];
                const disponibles = get().materiasDisponibles.filter((m) => m.materiaId !== materiaId);
                set({ celdas, materiasDisponibles: disponibles, dirty: true });
            },
            quitarMateria: (bloqueId, dia, planificacionId) => {
                const key = `${bloqueId}-${dia}`;
                const celdas = { ...get().celdas };
                const materiaRemovida = celdas[key]?.find((m) => m.planificacionId === planificacionId);
                celdas[key] = celdas[key]?.filter((m) => m.planificacionId !== planificacionId) ?? [];
                if (celdas[key].length === 0) delete celdas[key];
                const disponibles = materiaRemovida
                    ? [...get().materiasDisponibles, materiaRemovida]
                    : get().materiasDisponibles;
                set({ celdas, materiasDisponibles: disponibles, dirty: true });
            },
            setMateriasDisponibles: (materias) => set({ materiasDisponibles: materias }),
            marcarGuardado: () => set({ dirty: false }),
            limpiarStore: () => set({ periodoActivo: null, celdas: {}, materiasDisponibles: [], dirty: false }),
        }),
        { name: 'planificacion-store' }
    )
);