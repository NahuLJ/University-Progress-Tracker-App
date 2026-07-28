import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carrerasService } from '../services/carreras.service';
import { useNotificationStore } from '../store/notification.store';
import type { CrearCarreraDto, ActualizarCarreraDto, AgregarMateriaPlanDto, CarreraAdminFilters } from '../types/carrera.types';

export function useAdminCarreras(filters?: CarreraAdminFilters, page?: number, limit?: number) {
    const queryClient = useQueryClient();
    const addNotification = useNotificationStore((s) => s.addNotification);

    const listarCarreras = useQuery({
        queryKey: ['carreras', 'admin', filters, page, limit],
        queryFn: () => carrerasService.listarCarrerasAdmin({ ...filters, page, limit }),
    });

    const crearCarrera = useMutation({
        mutationFn: (data: CrearCarreraDto) => carrerasService.crearCarrera(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['carreras', 'admin'] });
            addNotification('Carrera creada correctamente', 'success');
        },
        onError: () => {
            addNotification('Error al crear la carrera', 'error');
        },
    });

    const actualizarCarrera = useMutation({
        mutationFn: ({ id, data }: { id: number; data: ActualizarCarreraDto }) =>
            carrerasService.actualizarCarrera(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['carreras', 'admin'] });
            addNotification('Carrera actualizada correctamente', 'success');
        },
        onError: () => {
            addNotification('Error al actualizar la carrera', 'error');
        },
    });

    const eliminarCarrera = useMutation({
        mutationFn: (id: number) => carrerasService.eliminarCarrera(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['carreras', 'admin'] });
            addNotification('Carrera desactivada', 'success');
        },
        onError: () => {
            addNotification('Error al desactivar la carrera', 'error');
        },
    });

    const restaurarCarrera = useMutation({
        mutationFn: (id: number) => carrerasService.restaurarCarrera(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['carreras', 'admin'] });
            addNotification('Carrera restaurada correctamente', 'success');
        },
        onError: () => {
            addNotification('Error al restaurar la carrera', 'error');
        },
    });

    const agregarMateriaAlPlan = useMutation({
        mutationFn: (params: { carreraId: number; data: AgregarMateriaPlanDto }) =>
            carrerasService.agregarMateriaAlPlan(params.carreraId, params.data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['plan-estudios', variables.carreraId] });
            queryClient.invalidateQueries({ queryKey: ['carreras', 'admin'] });
            addNotification('Materia agregada al plan', 'success');
        },
        onError: () => {
            addNotification('Error al agregar materia al plan', 'error');
        },
    });

    const quitarMateriaDelPlan = useMutation({
        mutationFn: (params: { carreraId: number; carreraMateriaId: number }) =>
            carrerasService.quitarMateriaDelPlan(params.carreraId, params.carreraMateriaId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['plan-estudios', variables.carreraId] });
            queryClient.invalidateQueries({ queryKey: ['carreras', 'admin'] });
            addNotification('Materia quitada del plan. Progreso y planificaciones eliminados.', 'success');
        },
        onError: () => {
            addNotification('Error al quitar materia del plan', 'error');
        },
    });

    return {
        listarCarreras,
        crearCarrera,
        actualizarCarrera,
        eliminarCarrera,
        restaurarCarrera,
        agregarMateriaAlPlan,
        quitarMateriaDelPlan,
    };
}