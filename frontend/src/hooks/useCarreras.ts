import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carrerasService } from '../services/carreras.service';
import { useAuthStore } from '../store/auth.store';
import { useCarreraStore } from '../store/carrera.store';
import { useNotificationStore } from '../store/notification.store';
import type { InscribirCarreraDto } from '../types/carrera.types';

export function useCarreras() {
    const usuario = useAuthStore((s) => s.usuario);
    const usuarioId = usuario?.id ?? usuario?.usuarioId;

    return useQuery({
        queryKey: ['carreras', usuarioId],
        queryFn: () => carrerasService.obtenerCarrerasDelUsuario(usuarioId!),
        enabled: !!usuarioId,
    });
}

export function useInscribirCarrera() {
    const queryClient = useQueryClient();
    const usuario = useAuthStore((s) => s.usuario);
    const usuarioId = usuario?.id ?? usuario?.usuarioId;
    const addNotification = useNotificationStore((s) => s.addNotification);

    return useMutation({
        mutationFn: (data: InscribirCarreraDto) =>
            carrerasService.inscribirCarrera(usuarioId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['carreras', usuarioId] });
            addNotification('Inscripción exitosa', 'success');
        },
        onError: () => {
            addNotification('Error al inscribirse en la carrera', 'error');
        },
    });
}

export function useDesinscribirCarrera() {
    const queryClient = useQueryClient();
    const usuario = useAuthStore((s) => s.usuario);
    const usuarioId = usuario?.id ?? usuario?.usuarioId;
    const addNotification = useNotificationStore((s) => s.addNotification);
    const setUsuarioCarreraId = useCarreraStore((s) => s.setUsuarioCarreraId);

    return useMutation({
        mutationFn: (usuarioCarreraId: number) =>
            carrerasService.desinscribirCarrera(usuarioId!, usuarioCarreraId),
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['carreras', usuarioId] });
            queryClient.invalidateQueries({ queryKey: ['carreras', 'disponibles', usuarioId] });
            queryClient.invalidateQueries({ queryKey: ['plan-estudios'] });
            queryClient.invalidateQueries({ queryKey: ['estadisticas', 'carreras-resumen', usuarioId] });
            addNotification('Inscripción desactivada', 'success');

            const activas = await queryClient.fetchQuery({
                queryKey: ['carreras', 'activas', usuarioId],
                queryFn: () => carrerasService.obtenerCarrerasActivasDelUsuario(usuarioId!),
            });
            setUsuarioCarreraId(activas[0]?.usuarioCarreraId ?? null);
        },
        onError: () => {
            addNotification('Error al desinscribirse', 'error');
        },
    });
}

export function useReactivarCarrera() {
    const queryClient = useQueryClient();
    const usuario = useAuthStore((s) => s.usuario);
    const usuarioId = usuario?.id ?? usuario?.usuarioId;
    const addNotification = useNotificationStore((s) => s.addNotification);

    return useMutation({
        mutationFn: (usuarioCarreraId: number) =>
            carrerasService.reactivarCarrera(usuarioId!, usuarioCarreraId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['carreras', usuarioId] });
            queryClient.invalidateQueries({ queryKey: ['carreras', 'disponibles', usuarioId] });
            queryClient.invalidateQueries({ queryKey: ['plan-estudios'] });
            queryClient.invalidateQueries({ queryKey: ['estadisticas', 'carreras-resumen', usuarioId] });
            addNotification('Inscripción reactivada', 'success');
        },
        onError: () => {
            addNotification('Error al reactivar la inscripción', 'error');
        },
    });
}

export function useEliminarCarreraDefinitivamente() {
    const queryClient = useQueryClient();
    const usuario = useAuthStore((s) => s.usuario);
    const usuarioId = usuario?.id ?? usuario?.usuarioId;
    const addNotification = useNotificationStore((s) => s.addNotification);
    const setUsuarioCarreraId = useCarreraStore((s) => s.setUsuarioCarreraId);

    return useMutation({
        mutationFn: (usuarioCarreraId: number) =>
            carrerasService.eliminarCarreraDefinitivamente(usuarioId!, usuarioCarreraId),
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['carreras', usuarioId] });
            queryClient.invalidateQueries({ queryKey: ['carreras', 'disponibles', usuarioId] });
            queryClient.invalidateQueries({ queryKey: ['plan-estudios'] });
            queryClient.invalidateQueries({ queryKey: ['estadisticas', 'carreras-resumen', usuarioId] });
            addNotification('Inscripción eliminada definitivamente', 'success');

            const activas = await queryClient.fetchQuery({
                queryKey: ['carreras', 'activas', usuarioId],
                queryFn: () => carrerasService.obtenerCarrerasActivasDelUsuario(usuarioId!),
            });
            setUsuarioCarreraId(activas[0]?.usuarioCarreraId ?? null);
        },
        onError: () => {
            addNotification('Error al eliminar la inscripción', 'error');
        },
    });
}

export function useCarreraActiva() {
    const { data: carreras, isLoading } = useCarreras();
    const storeId = useCarreraStore((s) => s.usuarioCarreraId);
    const setUsuarioCarreraId = useCarreraStore((s) => s.setUsuarioCarreraId);

    const activa = carreras?.find((c) => c.usuarioCarreraId === storeId)
        ?? carreras?.find((c) => c.activo)
        ?? carreras?.[0]
        ?? null;

    useEffect(() => {
        if (!isLoading && carreras && carreras.length > 0 && !storeId) {
            const primera = carreras.find((c) => c.activo) ?? carreras[0];
            setUsuarioCarreraId(primera.usuarioCarreraId);
        }
    }, [isLoading, carreras, storeId, setUsuarioCarreraId]);

    return {
        carreraActiva: activa,
        usuarioCarreraId: activa?.usuarioCarreraId ?? null,
        isLoading,
    };
}