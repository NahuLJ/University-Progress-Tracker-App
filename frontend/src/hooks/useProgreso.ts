import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progresoService } from '../services/progreso.service';
import { useNotificationStore } from '../store/notification.store';
import type { ActualizarProgresoDto } from '../types/progreso.types';
import type { AxiosError } from 'axios';

export function useProgreso(usuarioCarreraId: number | null, carreraId?: number | null) {
    const [filtroEstado, setFiltroEstado] = useState<string>('todas');
    const [busqueda, setBusqueda] = useState('');
    const queryClient = useQueryClient();
    const initializedRef = useRef<Set<number>>(new Set());

    const { data: progresos, isLoading, error } = useQuery({
        queryKey: ['progreso', usuarioCarreraId],
        queryFn: () => progresoService.obtenerProgreso(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    useEffect(() => {
        if (!usuarioCarreraId) return;
        if (isLoading || error) return;
        if (!progresos) return;
        if (initializedRef.current.has(usuarioCarreraId)) return;

        initializedRef.current.add(usuarioCarreraId);

        progresoService.inicializarProgreso(usuarioCarreraId).then(() => {
            queryClient.invalidateQueries({ queryKey: ['progreso'] });
            queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
            queryClient.invalidateQueries({ queryKey: ['plan-estudios'] });
            queryClient.invalidateQueries({ queryKey: ['planificacion'] });
        });
    }, [usuarioCarreraId, progresos, isLoading, error, queryClient]);

    const addNotification = useNotificationStore((s) => s.addNotification);

    const mutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: ActualizarProgresoDto }) => {
            if (carreraId == null) {
                throw new Error('Carrera no disponible para guardar el progreso');
            }
            return progresoService.actualizarProgreso(id, data, carreraId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['progreso'] });
            queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
            queryClient.invalidateQueries({ queryKey: ['plan-estudios'] });
            queryClient.invalidateQueries({ queryKey: ['planificacion'] });
            addNotification('Progreso actualizado', 'success');
        },
        onError: (error: AxiosError<{ message: string }>) => {
            const mensaje = error.response?.data?.message ?? 'Error al actualizar el progreso';
            addNotification(mensaje, 'error');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => progresoService.eliminarProgreso(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['progreso'] });
            queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
            queryClient.invalidateQueries({ queryKey: ['plan-estudios'] });
            queryClient.invalidateQueries({ queryKey: ['planificacion'] });
            addNotification('Registro eliminado', 'success');
        },
        onError: () => {
            addNotification('Error al eliminar el registro', 'error');
        },
    });

    const progresosFiltrados = useMemo(() => {
        if (!progresos) return [];
        return progresos.filter((p) => {
            const coincideEstado = filtroEstado === 'todas' || p.estado.nombre === filtroEstado;
            const coincideBusqueda = p.materia.nombre.toLowerCase().includes(busqueda.toLowerCase());
            return coincideEstado && coincideBusqueda;
        });
    }, [progresos, filtroEstado, busqueda]);

    const totales = useMemo(() => {
        if (!progresos) return { completadas: 0, enProceso: 0, pendientes: 0 };
        return {
            completadas: progresos.filter((p) => p.estado.nombre === 'Completada').length,
            enProceso: progresos.filter((p) => p.estado.nombre === 'En Proceso').length,
            pendientes: progresos.filter((p) => p.estado.nombre === 'Pendiente').length,
        };
    }, [progresos]);

    return {
        progresos: progresosFiltrados,
        totales,
        filtroEstado,
        setFiltroEstado,
        busqueda,
        setBusqueda,
        actualizar: (id: number, data: ActualizarProgresoDto) => mutation.mutate({ id, data }),
        eliminar: (id: number) => deleteMutation.mutate(id),
        isLoading,
        isSaving: mutation.isPending || deleteMutation.isPending,
        error,
    };
}