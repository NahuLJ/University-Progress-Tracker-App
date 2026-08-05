import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditosService } from '../services/creditos.service';
import { useNotificationStore } from '../store/notification.store';

export function useAdminCreditos(carreraId: number) {
    const queryClient = useQueryClient();
    const addNotification = useNotificationStore((s) => s.addNotification);

    const config = useQuery({
        queryKey: ['creditos', 'carrera', carreraId],
        queryFn: () => creditosService.obtenerConfiguracionCarrera(carreraId),
        enabled: carreraId > 0,
    });

    const categorias = useQuery({
        queryKey: ['creditos', 'categorias'],
        queryFn: () => creditosService.listarCategorias(true),
    });

    const actividades = useQuery({
        queryKey: ['creditos', 'actividades'],
        queryFn: () => creditosService.listarActividades(),
    });

    const invalidarConfig = () => {
        queryClient.invalidateQueries({ queryKey: ['creditos', 'carrera'] });
        queryClient.invalidateQueries({ queryKey: ['creditos', 'progreso'] });
        queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
    };

    const actualizarSistema = useMutation({
        mutationFn: (data: { creditosHabilitado: boolean; totalCreditos?: number }) =>
            creditosService.actualizarSistema(carreraId, data),
        onSuccess: () => {
            invalidarConfig();
            addNotification('Sistema de créditos actualizado', 'success');
        },
        onError: () => {
            addNotification('Error al actualizar el sistema de créditos', 'error');
        },
    });

    const crearCategoria = useMutation({
        mutationFn: (data: { nombre: string; descripcion?: string }) =>
            creditosService.crearCategoria(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['creditos', 'categorias'] });
        },
        onError: () => {
            addNotification('Error al crear la categoría', 'error');
        },
    });

    const agregarCategoria = useMutation({
        mutationFn: (data: { categoriaCreditoId: number; minimoCreditos: number }) =>
            creditosService.agregarCategoria(carreraId, data),
        onSuccess: () => {
            invalidarConfig();
            addNotification('Categoría agregada al sistema', 'success');
        },
        onError: () => {
            addNotification('Error al agregar la categoría', 'error');
        },
    });

    const actualizarCategoria = useMutation({
        mutationFn: (params: { carreraCategoriaCreditoId: number; minimoCreditos: number }) =>
            creditosService.actualizarCategoria(carreraId, params.carreraCategoriaCreditoId, {
                minimoCreditos: params.minimoCreditos,
            }),
        onSuccess: () => {
            invalidarConfig();
            addNotification('Categoría actualizada', 'success');
        },
        onError: () => {
            addNotification('Error al actualizar la categoría', 'error');
        },
    });

    const quitarCategoria = useMutation({
        mutationFn: (carreraCategoriaCreditoId: number) =>
            creditosService.quitarCategoria(carreraId, carreraCategoriaCreditoId),
        onSuccess: () => {
            invalidarConfig();
            addNotification('Categoría quitada del sistema', 'success');
        },
        onError: () => {
            addNotification('Error al quitar la categoría', 'error');
        },
    });

    const crearActividad = useMutation({
        mutationFn: (data: {
            nombre: string;
            descripcion?: string;
            categoriaCreditoId: number;
            creditos: number;
            materiasRequeridas?: number[];
        }) => creditosService.crearActividad(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['creditos', 'actividades'] });
        },
        onError: () => {
            addNotification('Error al crear la actividad', 'error');
        },
    });

    const agregarActividad = useMutation({
        mutationFn: (actividadCreditoId: number) =>
            creditosService.agregarActividad(carreraId, { actividadCreditoId }),
        onSuccess: () => {
            invalidarConfig();
            addNotification('Actividad agregada al sistema', 'success');
        },
        onError: () => {
            addNotification('Error al agregar la actividad', 'error');
        },
    });

    const quitarActividad = useMutation({
        mutationFn: (carreraActividadCreditoId: number) =>
            creditosService.quitarActividad(carreraId, carreraActividadCreditoId),
        onSuccess: () => {
            invalidarConfig();
            addNotification('Actividad quitada del sistema', 'success');
        },
        onError: () => {
            addNotification('Error al quitar la actividad', 'error');
        },
    });

    return {
        config,
        categorias,
        actividades,
        actualizarSistema,
        crearCategoria,
        agregarCategoria,
        actualizarCategoria,
        quitarCategoria,
        crearActividad,
        agregarActividad,
        quitarActividad,
    };
}
