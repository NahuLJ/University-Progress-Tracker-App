import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planificacionService } from '../services/planificacion.service';
import { useNotificationStore } from '../store/notification.store';
import { useTrayectoriaStore } from '../store/trayectoria.store';
import type {
    CrearTrayectoriaDto,
    ActualizarTrayectoriaDto,
    CrearPeriodoDto,
} from '../types/planificacion.types';

export function useTrayectoria(usuarioCarreraId: number | null) {
    const queryClient = useQueryClient();
    const addNotification = useNotificationStore((s) => s.addNotification);
    const store = useTrayectoriaStore();

    const trayectoriasQuery = useQuery({
        queryKey: ['trayectorias', usuarioCarreraId],
        queryFn: () => {
            if (!usuarioCarreraId) return [];
            return planificacionService.listarTrayectorias(usuarioCarreraId);
        },
        enabled: !!usuarioCarreraId,
    });

    const crearTrayectoriaMutation = useMutation({
        mutationFn: (data: CrearTrayectoriaDto) =>
            planificacionService.crearTrayectoria(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trayectorias', usuarioCarreraId] });
            addNotification('Trayectoria creada', 'success');
        },
        onError: () => {
            addNotification('Error al crear la trayectoria', 'error');
        },
    });

    const actualizarTrayectoriaMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: ActualizarTrayectoriaDto }) =>
            planificacionService.actualizarTrayectoria(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trayectorias', usuarioCarreraId] });
            addNotification('Trayectoria actualizada', 'success');
        },
        onError: () => {
            addNotification('Error al actualizar la trayectoria', 'error');
        },
    });

    const eliminarTrayectoriaMutation = useMutation({
        mutationFn: (id: number) => planificacionService.eliminarTrayectoria(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trayectorias', usuarioCarreraId] });
            queryClient.invalidateQueries({ queryKey: ['planificacion'] });
            addNotification('Trayectoria eliminada', 'success');
        },
        onError: () => {
            addNotification('Error al eliminar la trayectoria', 'error');
        },
    });

    const crearPeriodoSucesivoMutation = useMutation({
        mutationFn: (data: CrearPeriodoDto) =>
            planificacionService.crearPeriodo(data),
        onSuccess: (periodo) => {
            queryClient.invalidateQueries({ queryKey: ['trayectorias', usuarioCarreraId] });
            queryClient.invalidateQueries({ queryKey: ['planificacion'] });
            queryClient.invalidateQueries({ queryKey: ['trayectoria-arbol'] });
            addNotification('Planificación sucesiva creada', 'success');
            return periodo;
        },
        onError: () => {
            addNotification('Error al crear la planificación sucesiva', 'error');
        },
    });

    return {
        trayectorias: trayectoriasQuery.data ?? [],
        trayectoriasLoading: trayectoriasQuery.isLoading,
        trayectoriasError: trayectoriasQuery.error,
        crearTrayectoria: crearTrayectoriaMutation,
        actualizarTrayectoria: actualizarTrayectoriaMutation,
        eliminarTrayectoria: eliminarTrayectoriaMutation,
        crearPeriodoSucesivo: crearPeriodoSucesivoMutation,
        store,
    };
}

export function useArbolTrayectoria(trayectoriaId: number | null) {
    return useQuery({
        queryKey: ['trayectoria-arbol', trayectoriaId],
        queryFn: () => {
            if (!trayectoriaId) return null;
            return planificacionService.obtenerArbolTrayectoria(trayectoriaId);
        },
        enabled: !!trayectoriaId,
    });
}
