import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { MateriaEnCelda } from '../types/planificacion.types';
import { HORAS_POR_BLOQUE, horasAsignadas } from '../types/planificacion.types';
import { useNotificationStore } from './notification.store';

interface PeriodoActivo {
    periodoId: number | null;
    anio: number;
    instancia: string;
    nombre: string | null;
}

interface PlanificacionState {
    periodoActivo: PeriodoActivo | null;
    celdas: Record<string, MateriaEnCelda | null>;
    materiasDisponibles: MateriaEnCelda[];
    dirty: boolean;
    draggedMateriaId: number | null;
    draggedFromKey: string | null;
    hoveredCell: { bloqueId: number; dia: string } | null;
    removidas: number[];
    setPeriodoActivo: (periodo: PlanificacionState['periodoActivo']) => void;
    setCeldas: (celdas: Record<string, MateriaEnCelda | null>) => void;
    asignarMateria: (bloqueId: number, dia: string, materiaId: number) => void;
    moverMateria: (sourceKey: string, destBloqueId: number, destDia: string) => void;
    quitarMateria: (bloqueId: number, dia: string) => void;
    setMateriasDisponibles: (materias: MateriaEnCelda[]) => void;
    setDraggedMateriaId: (id: number | null) => void;
    setDraggedFromKey: (key: string | null) => void;
    setHoveredCell: (cell: { bloqueId: number; dia: string } | null) => void;
    marcarGuardado: () => void;
    resetCeldas: () => void;
    limpiarStore: () => void;
}

function actualizarDisponiblesAlQuitar(
    disponibles: MateriaEnCelda[],
    materia: MateriaEnCelda,
    celdas: Record<string, MateriaEnCelda | null>,
): MateriaEnCelda[] {
    const restan = materia.cargaHoraria - horasAsignadas(materia.materiaId, celdas);
    if (restan <= 0) return disponibles;
    if (disponibles.some((m) => m.materiaId === materia.materiaId)) return disponibles;
    return [...disponibles, materia];
}

export const usePlanificacionStore = create<PlanificacionState>()(
    devtools(
        (set, get) => ({
            periodoActivo: null,
            celdas: {},
            materiasDisponibles: [],
            dirty: false,
            draggedMateriaId: null,
            draggedFromKey: null,
            hoveredCell: null,
            removidas: [],
            setPeriodoActivo: (periodo) => set({ periodoActivo: periodo }),
            setCeldas: (celdas) => set({ celdas, dirty: false, removidas: [] }),
            setDraggedMateriaId: (id) => set({ draggedMateriaId: id }),
            setDraggedFromKey: (key) => set({ draggedFromKey: key }),
            setHoveredCell: (cell) => set({ hoveredCell: cell }),
            asignarMateria: (bloqueId, dia, materiaId) => {
                const materia = get().materiasDisponibles.find((m) => m.materiaId === materiaId);
                if (!materia) return;
                const key = `${bloqueId}-${dia}`;
                const celdas = { ...get().celdas };
                const removidas = [...get().removidas];
                let disponibles = [...get().materiasDisponibles];

                const ocupante = celdas[key];
                if (ocupante) {
                    if (ocupante.materiaId === materiaId) {
                        useNotificationStore.getState().addNotification(
                            'La materia ya está asignada en ese bloque',
                            'error',
                        );
                        return;
                    }
                    if (ocupante.planificacionId > 0) {
                        removidas.push(ocupante.planificacionId);
                    }
                    delete celdas[key];
                    disponibles = actualizarDisponiblesAlQuitar(disponibles, ocupante, celdas);
                }

                const yaAsignadas = horasAsignadas(materiaId, celdas);
                if (yaAsignadas >= materia.cargaHoraria) {
                    useNotificationStore.getState().addNotification(
                        'La materia ya tiene todas sus horas planificadas',
                        'error',
                    );
                    return;
                }

                celdas[key] = { ...materia, planificacionId: 0 };
                const restan = materia.cargaHoraria - (yaAsignadas + HORAS_POR_BLOQUE);
                if (restan <= 0) {
                    disponibles = disponibles.filter((m) => m.materiaId !== materiaId);
                }
                set({ celdas, materiasDisponibles: disponibles, removidas, dirty: true });
            },
            moverMateria: (sourceKey, destBloqueId, destDia) => {
                const destKey = `${destBloqueId}-${destDia}`;
                if (sourceKey === destKey) return;
                const celdas = { ...get().celdas };
                const materia = celdas[sourceKey];
                if (!materia) return;
                let removidas = [...get().removidas];
                let disponibles = [...get().materiasDisponibles];

                const ocupante = celdas[destKey];
                if (ocupante) {
                    if (ocupante.materiaId === materia.materiaId) {
                        useNotificationStore.getState().addNotification(
                            'La materia ya está asignada en ese bloque',
                            'error',
                        );
                        return;
                    }
                    if (ocupante.planificacionId > 0) {
                        removidas.push(ocupante.planificacionId);
                    }
                    delete celdas[destKey];
                    disponibles = actualizarDisponiblesAlQuitar(disponibles, ocupante, celdas);
                }

                if (materia.planificacionId > 0) {
                    removidas.push(materia.planificacionId);
                }
                delete celdas[sourceKey];
                celdas[destKey] = { ...materia, planificacionId: 0 };
                set({ celdas, materiasDisponibles: disponibles, removidas, dirty: true });
            },
            quitarMateria: (bloqueId, dia) => {
                const key = `${bloqueId}-${dia}`;
                const celdas = { ...get().celdas };
                const materiaRemovida = celdas[key];
                if (!materiaRemovida) return;
                const removidas = [...get().removidas];
                if (materiaRemovida.planificacionId > 0) {
                    removidas.push(materiaRemovida.planificacionId);
                }
                delete celdas[key];
                const disponibles = actualizarDisponiblesAlQuitar(
                    get().materiasDisponibles,
                    materiaRemovida,
                    celdas,
                );
                set({ celdas, materiasDisponibles: disponibles, removidas, dirty: true });
            },
            setMateriasDisponibles: (materias) => set({ materiasDisponibles: materias }),
    marcarGuardado: () => set({ dirty: false, removidas: [] }),
    resetCeldas: () => set({ celdas: {}, dirty: false, removidas: [] }),
    limpiarStore: () => set({ periodoActivo: null, celdas: {}, materiasDisponibles: [], dirty: false, draggedMateriaId: null, draggedFromKey: null, hoveredCell: null, removidas: [] }),
        }),
        { name: 'planificacion-store' }
    )
);
