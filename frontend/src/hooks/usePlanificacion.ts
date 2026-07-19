import { useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planificacionService } from '../services/planificacion.service';
import { usePlanificacionStore } from '../store/planificacion.store';
import { useNotificationStore } from '../store/notification.store';
import { useProgreso } from './useProgreso';
import type { Progreso } from '../types/progreso.types';
import type { CrearPeriodoDto, MateriaEnCelda } from '../types/planificacion.types';

export function usePlanificacion(usuarioCarreraId: number | null) {
    const queryClient = useQueryClient();
    const store = usePlanificacionStore();

    const { data: periodos, isLoading: periodosLoading, error: periodosError } = useQuery({
        queryKey: ['planificacion', 'periodos', usuarioCarreraId],
        queryFn: () => {
            if (!usuarioCarreraId) return [];
            return planificacionService.listarPeriodos(usuarioCarreraId);
        },
        enabled: !!usuarioCarreraId,
    });

    const { progresos: progresoData } = useProgreso(usuarioCarreraId);

    useEffect(() => {
        if (!progresoData) return;
        const pendientes: MateriaEnCelda[] = progresoData
            .filter((p: Progreso) => p.estado?.nombre !== 'Completada')
            .map((p: Progreso) => ({
                planificacionId: 0,
                materiaId: p.materia.materiaId,
                nombre: p.materia.nombre,
                codigo: p.materia.codigo,
                creditos: p.materia.creditos,
            }));
        usePlanificacionStore.getState().setMateriasDisponibles(pendientes);
    }, [progresoData]);

    const { data: materiasDesbloqueablesData } = useQuery({
        queryKey: ['planificacion', 'materias-desbloqueables', store.periodoActivo?.periodoId],
        queryFn: () => {
            if (!store.periodoActivo?.periodoId) return [];
            return planificacionService.obtenerMateriasDesbloqueables(store.periodoActivo.periodoId);
        },
        enabled: !!store.periodoActivo?.periodoId,
    });

    const materiasDesbloqueables = useMemo(() => materiasDesbloqueablesData ?? [], [materiasDesbloqueablesData]);

    const cargarPeriodo = useCallback(async (periodoId: number) => {
        try {
            const materias = await planificacionService.obtenerMateriasDelPeriodo(periodoId);
            const celdas: Record<string, MateriaEnCelda[]> = {};
            const planificadas: number[] = [];

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

            const state = usePlanificacionStore.getState();
            state.setCeldas(celdas);

            const disponibles = state.materiasDisponibles.filter((m: MateriaEnCelda) => !planificadas.includes(m.materiaId));
            state.setMateriasDisponibles(disponibles);
        } catch (error) {
            console.error('Error al cargar período:', error);
        }
    }, []);

    const addNotification = useNotificationStore((s) => s.addNotification);

    const crearPeriodoMutation = useMutation({
        mutationFn: (data: CrearPeriodoDto) => planificacionService.crearPeriodo(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['planificacion', 'periodos', usuarioCarreraId] });
            addNotification('Período creado', 'success');
        },
        onError: () => {
            addNotification('Error al crear el período', 'error');
        },
    });

    const guardarMutation = useMutation({
        mutationFn: async (periodoId: number) => {
            const state = usePlanificacionStore.getState();
            const asignaciones = Object.entries(state.celdas).flatMap(([key, materias]) => {
                const [bloqueId, diaSemana] = key.split('-');
                return materias
                    .filter((m: MateriaEnCelda) => m.planificacionId === 0)
                    .map((m: MateriaEnCelda) => ({
                        materiaId: m.materiaId,
                        bloqueId: parseInt(bloqueId),
                        diaSemana: diaSemana as 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado',
                    }));
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