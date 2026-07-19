import { useMutation, useQueryClient } from '@tanstack/react-query';
import { carrerasService } from '../services/carreras.service';
import { useNotificationStore } from '../store/notification.store';
import type { CrearCarreraDto, AgregarMateriaPlanDto } from '../types/carrera.types';

export function useAdminCarreras() {
    const queryClient = useQueryClient();
    const addNotification = useNotificationStore((s) => s.addNotification);

    const crearCarrera = useMutation({
        mutationFn: (data: CrearCarreraDto) => carrerasService.crearCarrera(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['carreras', 'disponibles'] });
            addNotification('Carrera creada', 'success');
        },
        onError: () => {
            addNotification('Error al crear la carrera', 'error');
        },
    });

    const agregarMateriaAlPlan = useMutation({
        mutationFn: (params: { carreraId: number; data: AgregarMateriaPlanDto }) =>
            carrerasService.agregarMateriaAlPlan(params.carreraId, params.data),
        onSuccess: () => {
            addNotification('Materia agregada al plan', 'success');
        },
        onError: () => {
            addNotification('Error al agregar materia al plan', 'error');
        },
    });

    return { crearCarrera, agregarMateriaAlPlan };
}
