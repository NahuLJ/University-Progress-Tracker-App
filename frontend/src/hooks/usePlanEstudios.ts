import { useQuery } from '@tanstack/react-query';
import { carrerasService } from '../services/carreras.service';

export function usePlanEstudios(carreraId: number | undefined) {
    return useQuery({
        queryKey: ['plan-estudios', carreraId],
        queryFn: () => carrerasService.obtenerPlanEstudios(carreraId!),
        enabled: !!carreraId,
    });
}