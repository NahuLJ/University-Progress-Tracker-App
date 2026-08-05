import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditosService } from '../services/creditos.service';
import { useNotificationStore } from '../store/notification.store';

export function useCreditos(usuarioCarreraId: number | null) {
    const queryClient = useQueryClient();
    const addNotification = useNotificationStore((s) => s.addNotification);

    const progreso = useQuery({
        queryKey: ['creditos', 'progreso', usuarioCarreraId],
        queryFn: () => creditosService.obtenerProgreso(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    const invalidarProgreso = () => {
        queryClient.invalidateQueries({ queryKey: ['creditos', 'progreso'] });
        queryClient.invalidateQueries({ queryKey: ['estadisticas', 'creditos-progreso'] });
        queryClient.invalidateQueries({ queryKey: ['creditos', 'carrera'] });
    };

    const marcarCompletada = useMutation({
        mutationFn: (actividadCreditoId: number) =>
            creditosService.marcarCompletada(usuarioCarreraId!, actividadCreditoId),
        onSuccess: () => {
            invalidarProgreso();
            addNotification('Actividad completada', 'success');
        },
        onError: () => {
            addNotification('No se pudo completar la actividad', 'error');
        },
    });

    const desmarcar = useMutation({
        mutationFn: (progresoActividadId: number) =>
            creditosService.desmarcar(progresoActividadId),
        onSuccess: () => {
            invalidarProgreso();
            addNotification('Actividad desmarcada', 'success');
        },
        onError: () => {
            addNotification('No se pudo desmarcar la actividad', 'error');
        },
    });

    return { progreso, marcarCompletada, desmarcar };
}
