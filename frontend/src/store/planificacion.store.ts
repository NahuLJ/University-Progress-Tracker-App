import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { MateriaEnCelda } from '../types/planificacion.types';
import { bloquesRequeridos, MAX_BLOQUE_ID } from '../types/planificacion.types';
import { useNotificationStore } from './notification.store';

interface PeriodoActivo {
    periodoId: number | null;
    anio: number;
    instancia: string;
    nombre: string | null;
}

function getOccupiedCells(celdas: Record<string, MateriaEnCelda | null>): Set<string> {
    const occupied = new Set<string>();
    for (const [key, materia] of Object.entries(celdas)) {
        if (!materia) continue;
        const [bloqueIdStr, dia] = key.split('-');
        const bloqueId = parseInt(bloqueIdStr);
        const span = bloquesRequeridos(materia.cargaHoraria);
        for (let i = 0; i < span; i++) {
            occupied.add(`${bloqueId + i}-${dia}`);
        }
    }
    return occupied;
}

interface PlanificacionState {
    periodoActivo: PeriodoActivo | null;
    celdas: Record<string, MateriaEnCelda | null>;
    materiasDisponibles: MateriaEnCelda[];
    dirty: boolean;
    draggedMateriaId: number | null;
    hoveredCell: { bloqueId: number; dia: string } | null;
    setPeriodoActivo: (periodo: PlanificacionState['periodoActivo']) => void;
    setCeldas: (celdas: Record<string, MateriaEnCelda | null>) => void;
    asignarMateria: (bloqueId: number, dia: string, materiaId: number) => void;
    quitarMateria: (bloqueId: number, dia: string) => void;
    setMateriasDisponibles: (materias: MateriaEnCelda[]) => void;
    setDraggedMateriaId: (id: number | null) => void;
    setHoveredCell: (cell: { bloqueId: number; dia: string } | null) => void;
    marcarGuardado: () => void;
    resetCeldas: () => void;
    limpiarStore: () => void;
}

export const usePlanificacionStore = create<PlanificacionState>()(
    devtools(
        (set, get) => ({
            periodoActivo: null,
            celdas: {},
            materiasDisponibles: [],
            dirty: false,
            draggedMateriaId: null,
            hoveredCell: null,
            setPeriodoActivo: (periodo) => set({ periodoActivo: periodo }),
            setCeldas: (celdas) => set({ celdas, dirty: false }),
            setDraggedMateriaId: (id) => set({ draggedMateriaId: id }),
            setHoveredCell: (cell) => set({ hoveredCell: cell }),
            asignarMateria: (bloqueId, dia, materiaId) => {
                const materia = get().materiasDisponibles.find((m) => m.materiaId === materiaId);
                if (!materia) return;
                const span = bloquesRequeridos(materia.cargaHoraria);
                if (bloqueId + span - 1 > MAX_BLOQUE_ID) {
                    useNotificationStore.getState().addNotification(
                        'La materia no entra en los bloques restantes de ese día',
                        'error',
                    );
                    return;
                }
                const celdas = { ...get().celdas };
                const occupied = getOccupiedCells(celdas);

                for (let i = 0; i < span; i++) {
                    const checkKey = `${bloqueId + i}-${dia}`;
                    if (occupied.has(checkKey)) {
                        useNotificationStore.getState().addNotification(
                            'El bloque horario ya está ocupado en ese día',
                            'error',
                        );
                        return;
                    }
                }

                celdas[`${bloqueId}-${dia}`] = { ...materia, planificacionId: 0 };
                const disponibles = get().materiasDisponibles.filter((m) => m.materiaId !== materiaId);
                set({ celdas, materiasDisponibles: disponibles, dirty: true });
            },
            quitarMateria: (bloqueId, dia) => {
                const key = `${bloqueId}-${dia}`;
                const celdas = { ...get().celdas };
                const materiaRemovida = celdas[key];
                delete celdas[key];
                const disponibles = materiaRemovida
                    ? [...get().materiasDisponibles, materiaRemovida]
                    : get().materiasDisponibles;
                set({ celdas, materiasDisponibles: disponibles, dirty: true });
            },
            setMateriasDisponibles: (materias) => set({ materiasDisponibles: materias }),
    marcarGuardado: () => set({ dirty: false }),
    resetCeldas: () => set({ celdas: {}, dirty: false }),
    limpiarStore: () => set({ periodoActivo: null, celdas: {}, materiasDisponibles: [], dirty: false, draggedMateriaId: null, hoveredCell: null }),
        }),
        { name: 'planificacion-store' }
    )
);