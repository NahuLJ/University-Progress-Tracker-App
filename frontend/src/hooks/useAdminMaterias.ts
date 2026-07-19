import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materiasAdminService } from '../services/carreras.service';
import { useNotificationStore } from '../store/notification.store';
import type { CrearMateriaDto, AsignarCorrelativaDto } from '../types/materia.types';

export function useAdminMaterias() {
    const queryClient = useQueryClient();
    const addNotification = useNotificationStore((s) => s.addNotification);

    const listarMaterias = useQuery({
        queryKey: ['materias', 'catalogo'],
        queryFn: () => materiasAdminService.listarMaterias(),
    });

    const crearMateria = useMutation({
        mutationFn: (data: CrearMateriaDto) => materiasAdminService.crearMateria(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materias', 'catalogo'] });
            addNotification('Materia creada', 'success');
        },
        onError: () => {
            addNotification('Error al crear la materia', 'error');
        },
    });

    const asignarCorrelativa = useMutation({
        mutationFn: (params: { materiaId: number; data: AsignarCorrelativaDto }) =>
            materiasAdminService.asignarCorrelativa(params.materiaId, params.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materias', 'catalogo'] });
            addNotification('Correlativa asignada', 'success');
        },
        onError: () => {
            addNotification('Error al asignar correlativa', 'error');
        },
    });

    const eliminarCorrelativa = useMutation({
        mutationFn: (params: { materiaId: number; correlativaId: number }) =>
            materiasAdminService.eliminarCorrelativa(params.materiaId, params.correlativaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materias', 'catalogo'] });
            addNotification('Correlativa eliminada', 'success');
        },
        onError: () => {
            addNotification('Error al eliminar correlativa', 'error');
        },
    });

    return { listarMaterias, crearMateria, asignarCorrelativa, eliminarCorrelativa };
}
