import { useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planificacionService } from '../services/planificacion.service';
import { usePlanificacionStore } from '../store/planificacion.store';
import { useNotificationStore } from '../store/notification.store';
import { useProgreso } from './useProgreso';
import type { ActualizarPeriodoDto, CrearPeriodoDto, MateriaEnCelda } from '../types/planificacion.types';
import { horasAsignadas } from '../types/planificacion.types';

export function usePlanificacion(usuarioCarreraId: number | null, _carreraId: number | null) {
    const queryClient = useQueryClient();
    const store = usePlanificacionStore();

    useProgreso(usuarioCarreraId);

    const { data: periodos, isLoading: periodosLoading, error: periodosError } = useQuery({
        queryKey: ['planificacion', 'periodos', usuarioCarreraId],
        queryFn: () => {
            if (!usuarioCarreraId) return [];
            return planificacionService.listarPeriodos(usuarioCarreraId);
        },
        enabled: !!usuarioCarreraId,
    });

    const periodoActivoStore = store.periodoActivo;
    const periodoActual = useMemo(() => {
        if (!periodoActivoStore?.periodoId || !periodos) return null;
        return periodos.find((p) => p.periodoId === periodoActivoStore.periodoId) ?? null;
    }, [periodos, periodoActivoStore?.periodoId]);

    const disponiblesKey = [
        'planificacion', 'disponibles', usuarioCarreraId,
        periodoActual?.trayectoriaId, periodoActual?.periodoId,
    ];

    const { data: materiasDisponiblesData } = useQuery({
        queryKey: disponiblesKey,
        queryFn: () => {
            if (!usuarioCarreraId) return [];
            return planificacionService.obtenerMateriasDisponibles(
                usuarioCarreraId,
                periodoActual?.trayectoriaId ?? undefined,
                periodoActual?.periodoId ?? undefined,
            );
        },
        enabled: !!usuarioCarreraId,
    });

    useEffect(() => {
        if (!materiasDisponiblesData) return;
        const state = usePlanificacionStore.getState();
        if (state.periodoActivo) {
            state.setMateriasDisponibles(
                materiasDisponiblesData.filter((m) =>
                    horasAsignadas(m.materiaId, state.celdas) < m.cargaHoraria,
                ),
            );
        } else {
            state.setMateriasDisponibles(materiasDisponiblesData);
        }
    }, [materiasDisponiblesData]);

    const idsSeleccionados = useMemo(() => {
        const ids = new Set<number>();
        for (const m of Object.values(store.celdas)) {
            if (m) ids.add(m.materiaId);
        }
        return [...ids];
    }, [store.celdas]);

    const celdasKey = JSON.stringify([...idsSeleccionados].sort());

    const { data: materiasDesbloqueablesData } = useQuery({
        queryKey: ['planificacion', 'materias-desbloqueables', store.periodoActivo?.periodoId, celdasKey],
        queryFn: () => {
            if (!store.periodoActivo?.periodoId) return [];
            return planificacionService.obtenerMateriasDesbloqueables(
                store.periodoActivo.periodoId,
                idsSeleccionados,
            );
        },
        enabled: !!store.periodoActivo?.periodoId,
    });

    const idsDisponibles = useMemo(() => new Set(store.materiasDisponibles.map((m) => m.materiaId)), [store.materiasDisponibles]);

    const materiasDesbloqueables = useMemo(
        () => (materiasDesbloqueablesData ?? []).filter((m: any) => !idsDisponibles.has(m.materiaId)),
        [materiasDesbloqueablesData, idsDisponibles],
    );

    const cargarPeriodo = useCallback(async (periodoId: number) => {
        try {
            let disponiblesFull = materiasDisponiblesData;
            if (!disponiblesFull) {
                disponiblesFull = await planificacionService.obtenerMateriasDisponibles(usuarioCarreraId!);
            }
            usePlanificacionStore.getState().setMateriasDisponibles(disponiblesFull);
            usePlanificacionStore.getState().resetCeldas();

            const periodo = periodos?.find((p) => p.periodoId === periodoId);
            if (periodo) {
                usePlanificacionStore.getState().setPeriodoActivo({
                    periodoId: periodo.periodoId,
                    anio: periodo.anio,
                    instancia: periodo.instancia,
                    nombre: periodo.nombre,
                });
            }

            const materias = await planificacionService.obtenerMateriasDelPeriodo(periodoId);
            const celdas: Record<string, MateriaEnCelda | null> = {};

            for (const mp of materias) {
                const key = `${mp.bloque.bloqueId}-${mp.diaSemana}`;
                celdas[key] = {
                    planificacionId: mp.planificacionId,
                    materiaId: mp.materia.materiaId,
                    nombre: mp.materia.nombre,
                    codigo: mp.materia.codigo,
                    creditos: mp.materia.creditos,
                    cargaHoraria: mp.materia.cargaHoraria,
                };
            }

            usePlanificacionStore.getState().setCeldas(celdas);

            const state = usePlanificacionStore.getState();
            const disponibles = state.materiasDisponibles.filter((m) =>
                horasAsignadas(m.materiaId, state.celdas) < m.cargaHoraria,
            );
            usePlanificacionStore.getState().setMateriasDisponibles(disponibles);
        } catch (error) {
            console.error('Error al cargar período:', error);
        }
    }, [periodos, materiasDisponiblesData, usuarioCarreraId]);

    const addNotification = useNotificationStore((s) => s.addNotification);

    const crearPeriodoMutation = useMutation({
        mutationFn: (data: CrearPeriodoDto) => planificacionService.crearPeriodo(data),
        onSuccess: (nuevoPeriodo) => {
            queryClient.invalidateQueries({ queryKey: ['planificacion', 'periodos', usuarioCarreraId] });
            usePlanificacionStore.getState().setPeriodoActivo({
                periodoId: nuevoPeriodo.periodoId,
                anio: nuevoPeriodo.anio,
                instancia: nuevoPeriodo.instancia,
                nombre: nuevoPeriodo.nombre,
            });
            addNotification('Período creado', 'success');
        },
        onError: () => {
            addNotification('Error al crear el período', 'error');
        },
    });

    const guardarMutation = useMutation({
        mutationFn: async (periodoId: number) => {
            const state = usePlanificacionStore.getState();

            const asignaciones = Object.entries(state.celdas).flatMap(([key, materia]) => {
                if (!materia || materia.planificacionId !== 0) return [];
                const [bloqueId, diaSemana] = key.split('-');
                return [{
                    materiaId: materia.materiaId,
                    bloqueId: parseInt(bloqueId),
                    diaSemana: diaSemana as 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado',
                }];
            });

            const idsPorCelda: Record<string, number> = {};

            for (const id of state.removidas) {
                await planificacionService.eliminarMateriaPlanificada(id);
            }
            for (const a of asignaciones) {
                const resultado = await planificacionService.planificarMateria(periodoId, a);
                idsPorCelda[`${a.bloqueId}-${a.diaSemana}`] = resultado.planificacionId;
            }

            return idsPorCelda;
        },
        onSuccess: (idsPorCelda) => {
            const currentState = usePlanificacionStore.getState();
            const celdas = { ...currentState.celdas };
            for (const [key, planificacionId] of Object.entries(idsPorCelda)) {
                if (celdas[key]) {
                    celdas[key] = { ...celdas[key]!, planificacionId };
                }
            }
            currentState.setCeldas(celdas);
            queryClient.invalidateQueries({ queryKey: ['planificacion'] });
            addNotification('Planificación guardada', 'success');
        },
        onError: () => {
            addNotification('Error al guardar la planificación', 'error');
        },
    });

    const actualizarPeriodoMutation = useMutation({
        mutationFn: (data: ActualizarPeriodoDto) => {
            const periodoId = store.periodoActivo?.periodoId;
            if (!periodoId) throw new Error('No hay período activo');
            return planificacionService.actualizarPeriodo(periodoId, data);
        },
        onSuccess: (actualizado) => {
            queryClient.invalidateQueries({ queryKey: ['planificacion'] });
            usePlanificacionStore.getState().setPeriodoActivo(actualizado);
            addNotification('Período actualizado', 'success');
        },
        onError: () => {
            addNotification('Error al actualizar el período', 'error');
        },
    });

    return {
        periodos,
        periodosLoading,
        periodosError: periodosError,
        crearPeriodo: crearPeriodoMutation,
        guardar: guardarMutation,
        actualizarPeriodo: actualizarPeriodoMutation,
        cargarPeriodo,
        materiasDesbloqueables,
        store,
    };
}