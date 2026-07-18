import { useMutation, useQueryClient } from '@tanstack/react-query';
import { carrerasService } from '../services/carreras.service';
import type { CrearCarreraDto, AgregarMateriaPlanDto } from '../types/carrera.types';

export function useAdminCarreras() {
    const queryClient = useQueryClient();

    const crearCarrera = useMutation({
        mutationFn: (data: CrearCarreraDto) => carrerasService.crearCarrera(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['carreras', 'disponibles'] });
        },
    });

    const agregarMateriaAlPlan = useMutation({
        mutationFn: (params: { carreraId: number; data: AgregarMateriaPlanDto }) =>
            carrerasService.agregarMateriaAlPlan(params.carreraId, params.data),
    });

    return { crearCarrera, agregarMateriaAlPlan };
}
