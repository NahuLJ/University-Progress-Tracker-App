import { useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planificacionService } from '../services/planificacion.service';
import { usePlanificacionStore } from '../store/planificacion.store';
import { useNotificationStore } from '../store/notification.store';
import { useProgreso } from './useProgreso';
import type { CrearPeriodoDto, MateriaEnCelda } from '../types/planificacion.types';

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

    const { data: materiasDisponiblesData } = useQuery({
        queryKey: ['planificacion', 'disponibles', usuarioCarreraId],
        queryFn: () => {
            if (!usuarioCarreraId) return [];
            return planificacionService.obtenerMateriasDisponibles(usuarioCarreraId);
        },
        enabled: !!usuarioCarreraId,
    });

    useEffect(() => {
        if (!materiasDisponiblesData) return;
        const state = usePlanificacionStore.getState();
        if (state.periodoActivo) {
            const planificadas = new Set(
                Object.values(state.celdas)
                    .filter((m): m is MateriaEnCelda => m !== null)
                    .map((m) => m.materiaId),
            );
            state.setMateriasDisponibles(
                materiasDisponiblesData.filter((m) => !planificadas.has(m.materiaId)),
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
                idsSeleccionados.length > 0 ? idsSeleccionados : undefined,
            );
        },
        enabled: !!store.periodoActivo?.periodoId,
    });

    useEffect(() => {
        if (store.periodoActivo?.periodoId) {
            queryClient.invalidateQueries({
                queryKey: ['planificacion', 'materias-desbloqueables', store.periodoActivo.periodoId],
            });
        }
    }, [store.celdas, store.periodoActivo?.periodoId, queryClient]);

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
            const planificadas: number[] = [];

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
                planificadas.push(mp.materia.materiaId);
            }

            usePlanificacionStore.getState().setCeldas(celdas);

            const disponibles = usePlanificacionStore.getState().materiasDisponibles.filter(
                (m: MateriaEnCelda) => !planificadas.includes(m.materiaId),
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
            await Promise.all(
                asignaciones.map((asignacion) =>
                    planificacionService.planificarMateria(periodoId, asignacion),
                ),
            );
        },
        onSuccess: () => {
            store.marcarGuardado();
            queryClient.invalidateQueries({ queryKey: ['planificacion'] });
            addNotification('Planificación guardada', 'success');
        },
        onError: () => {
            addNotification('Error al guardar la planificación', 'error');
        },
    });

    return {
        periodos,
        periodosLoading,
        periodosError: periodosError,
        crearPeriodo: crearPeriodoMutation,
        guardar: guardarMutation,
        cargarPeriodo,
        materiasDesbloqueables,
        store,
    };
}