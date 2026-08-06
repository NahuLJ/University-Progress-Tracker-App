import { useQuery } from '@tanstack/react-query';
import { carrerasService } from '../services/carreras.service';

export function usePlanEstudios(carreraId: number | undefined, usuarioId?: number | null) {
    return useQuery({
        queryKey: ['plan-estudios', carreraId, usuarioId],
        queryFn: () => carrerasService.obtenerPlanEstudios(carreraId!, usuarioId ?? undefined),
        enabled: !!carreraId,
    });
}
