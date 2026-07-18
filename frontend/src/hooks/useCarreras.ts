import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carrerasService } from '../services/carreras.service';
import { useAuthStore } from '../store/auth.store';
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

    return useMutation({
        mutationFn: (data: InscribirCarreraDto) =>
            carrerasService.inscribirCarrera(usuarioId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['carreras', usuarioId] });
        },
    });
}

export function useDesinscribirCarrera() {
    const queryClient = useQueryClient();
    const usuario = useAuthStore((s) => s.usuario);
    const usuarioId = usuario?.id ?? usuario?.usuarioId;

    return useMutation({
        mutationFn: (usuarioCarreraId: number) =>
            carrerasService.desinscribirCarrera(usuarioId!, usuarioCarreraId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['carreras', usuarioId] });
        },
    });
}

export function useCarreraActiva() {
    const { data: carreras, isLoading } = useCarreras();
    const activa = carreras?.find((c) => c.activo) ?? carreras?.[0] ?? null;

    return {
        carreraActiva: activa,
        usuarioCarreraId: activa?.usuarioCarreraId ?? null,
        isLoading,
    };
}