import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materiasAdminService } from '../services/carreras.service';
import type { CrearMateriaDto, AsignarCorrelativaDto } from '../types/materia.types';

export function useAdminMaterias() {
    const queryClient = useQueryClient();

    const listarMaterias = useQuery({
        queryKey: ['materias', 'catalogo'],
        queryFn: () => materiasAdminService.listarMaterias(),
    });

    const crearMateria = useMutation({
        mutationFn: (data: CrearMateriaDto) => materiasAdminService.crearMateria(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materias', 'catalogo'] });
        },
    });

    const asignarCorrelativa = useMutation({
        mutationFn: (params: { materiaId: number; data: AsignarCorrelativaDto }) =>
            materiasAdminService.asignarCorrelativa(params.materiaId, params.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materias', 'catalogo'] });
        },
    });

    const eliminarCorrelativa = useMutation({
        mutationFn: (params: { materiaId: number; correlativaId: number }) =>
            materiasAdminService.eliminarCorrelativa(params.materiaId, params.correlativaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materias', 'catalogo'] });
        },
    });

    return { listarMaterias, crearMateria, asignarCorrelativa, eliminarCorrelativa };
}
