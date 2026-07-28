import { useQuery } from '@tanstack/react-query';
import { materiasAdminService } from '../services/carreras.service';

export function useMateriaDetalle(id: number, carreraId?: number) {
    return useQuery({
        queryKey: ['materia', 'detalle', id, carreraId],
        queryFn: () => materiasAdminService.obtenerMateria(id, carreraId),
        enabled: !!id,
    });
}