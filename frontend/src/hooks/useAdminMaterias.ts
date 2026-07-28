import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materiasAdminService } from '../services/carreras.service';
import { useNotificationStore } from '../store/notification.store';
import type { CrearMateriaDto, ActualizarMateriaDto, AsignarCorrelativaDto, MateriaAdminFilters } from '../types/materia.types';

export function useAdminMaterias(filters?: MateriaAdminFilters, page?: number, limit?: number) {
    const queryClient = useQueryClient();
    const addNotification = useNotificationStore((s) => s.addNotification);

    const listarMaterias = useQuery({
        queryKey: ['materias', 'admin', filters, page, limit],
        queryFn: () => materiasAdminService.listarMateriasAdmin({ ...filters, page, limit }),
    });

    const crearMateria = useMutation({
        mutationFn: (data: CrearMateriaDto) => materiasAdminService.crearMateria(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materias', 'admin'] });
            addNotification('Materia creada correctamente', 'success');
        },
        onError: () => {
            addNotification('Error al crear la materia', 'error');
        },
    });

    const actualizarMateria = useMutation({
        mutationFn: ({ id, data }: { id: number; data: ActualizarMateriaDto }) =>
            materiasAdminService.actualizarMateria(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materias', 'admin'] });
            addNotification('Materia actualizada correctamente', 'success');
        },
        onError: () => {
            addNotification('Error al actualizar la materia', 'error');
        },
    });

    const eliminarMateria = useMutation({
        mutationFn: (id: number) => materiasAdminService.eliminarMateria(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materias', 'admin'] });
            addNotification('Materia desactivada. Progreso, planes y correlativas eliminados.', 'success');
        },
        onError: () => {
            addNotification('Error al desactivar la materia', 'error');
        },
    });

    const restaurarMateria = useMutation({
        mutationFn: (id: number) => materiasAdminService.restaurarMateria(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materias', 'admin'] });
            addNotification('Materia restaurada correctamente', 'success');
        },
        onError: () => {
            addNotification('Error al restaurar la materia', 'error');
        },
    });

    const asignarCorrelativa = useMutation({
        mutationFn: (params: { materiaId: number; data: AsignarCorrelativaDto }) =>
            materiasAdminService.asignarCorrelativa(params.materiaId, params.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materias', 'admin'] });
            addNotification('Correlativa asignada', 'success');
        },
        onError: () => {
            addNotification('Error al asignar correlativa', 'error');
        },
    });

    const eliminarCorrelativa = useMutation({
        mutationFn: (params: { materiaId: number; correlativaId: number; carreraId?: number }) =>
            materiasAdminService.eliminarCorrelativa(params.materiaId, params.correlativaId, params.carreraId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materias', 'admin'] });
            addNotification('Correlativa eliminada', 'success');
        },
        onError: () => {
            addNotification('Error al eliminar correlativa', 'error');
        },
    });

    return {
        listarMaterias,
        crearMateria,
        actualizarMateria,
        eliminarMateria,
        restaurarMateria,
        asignarCorrelativa,
        eliminarCorrelativa,
    };
}