import { useQuery } from '@tanstack/react-query';
import { useDashboard } from './useDashboard';
import { estadisticasService } from '../services/estadisticas.service';

export function useEstadisticas() {
    const dashboard = useDashboard();
    const usuarioCarreraId = dashboard.usuarioCarreraId;

    const { data: notasDistribucion } = useQuery({
        queryKey: ['estadisticas', 'notas-distribucion', usuarioCarreraId],
        queryFn: () => estadisticasService.obtenerNotasDistribucion(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    const { data: progresoPorAnio } = useQuery({
        queryKey: ['estadisticas', 'progreso-por-anio', usuarioCarreraId],
        queryFn: () => estadisticasService.obtenerProgresoPorAnio(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    return {
        ...dashboard,
        notasDistribucion,
        progresoPorAnio,
    };
}
