import { useQuery } from '@tanstack/react-query';
import { carrerasService } from '../services/carreras.service';

export function usePlanEstudios(carreraId: number | undefined, usuarioCarreraId?: number | null) {
    return useQuery({
        queryKey: ['plan-estudios', carreraId, usuarioCarreraId],
        queryFn: () => carrerasService.obtenerPlanEstudios(carreraId!, usuarioCarreraId ?? undefined),
        enabled: !!carreraId,
    });
}
