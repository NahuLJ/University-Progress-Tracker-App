import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditosService } from '../services/creditos.service';
import { useNotificationStore } from '../store/notification.store';

export function useAdminCreditosCatalogo() {
    const queryClient = useQueryClient();
    const addNotification = useNotificationStore((s) => s.addNotification);

    const categorias = useQuery({
        queryKey: ['creditos', 'catalogo', 'categorias'],
        queryFn: () => creditosService.listarCategorias(true),
    });

    const actividades = useQuery({
        queryKey: ['creditos', 'catalogo', 'actividades'],
        queryFn: () => creditosService.listarActividades(undefined, undefined, true),
    });

    const invalidarCatalogoYConfigs = () => {
        queryClient.invalidateQueries({ queryKey: ['creditos', 'catalogo'] });
        queryClient.invalidateQueries({ queryKey: ['creditos', 'categorias'] });
        queryClient.invalidateQueries({ queryKey: ['creditos', 'actividades'] });
        queryClient.invalidateQueries({ queryKey: ['creditos', 'carrera'] });
        queryClient.invalidateQueries({ queryKey: ['creditos', 'progreso'] });
        queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
    };

    const crearCategoria = useMutation({
        mutationFn: (data: { nombre: string; descripcion?: string }) =>
            creditosService.crearCategoria(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['creditos', 'catalogo', 'categorias'] });
            queryClient.invalidateQueries({ queryKey: ['creditos', 'categorias'] });
            addNotification('Categoría creada', 'success');
        },
        onError: () => {
            addNotification('Error al crear la categoría', 'error');
        },
    });

    const actualizarCategoria = useMutation({
        mutationFn: (params: {
            categoriaCreditoId: number;
            data: { nombre?: string; descripcion?: string };
        }) => creditosService.actualizarCategoriaCatalogo(params.categoriaCreditoId, params.data),
        onSuccess: () => {
            invalidarCatalogoYConfigs();
            addNotification('Categoría actualizada', 'success');
        },
        onError: () => {
            addNotification('Error al actualizar la categoría', 'error');
        },
    });

    const eliminarCategoria = useMutation({
        mutationFn: (categoriaCreditoId: number) =>
            creditosService.eliminarCategoriaCatalogo(categoriaCreditoId),
        onSuccess: () => {
            invalidarCatalogoYConfigs();
            addNotification('Categoría desactivada junto con sus actividades', 'success');
        },
        onError: () => {
            addNotification('Error al desactivar la categoría', 'error');
        },
    });

    const restaurarCategoria = useMutation({
        mutationFn: (params: { categoriaCreditoId: number; restaurarActividades?: boolean }) =>
            creditosService.restaurarCategoriaCatalogo(
                params.categoriaCreditoId,
                params.restaurarActividades,
            ),
        onSuccess: (_data, variables) => {
            invalidarCatalogoYConfigs();
            addNotification(
                variables.restaurarActividades
                    ? 'Categoría y sus actividades restauradas'
                    : 'Categoría restaurada',
                'success',
            );
        },
        onError: () => {
            addNotification('Error al restaurar la categoría', 'error');
        },
    });

    const crearActividad = useMutation({
        mutationFn: (data: {
            nombre: string;
            descripcion?: string;
            categoriaCreditoId: number;
            creditos: number;
        }) => creditosService.crearActividad(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['creditos', 'catalogo', 'actividades'] });
            queryClient.invalidateQueries({ queryKey: ['creditos', 'actividades'] });
            addNotification('Actividad creada', 'success');
        },
        onError: () => {
            addNotification('Error al crear la actividad', 'error');
        },
    });

    const actualizarActividad = useMutation({
        mutationFn: (params: {
            actividadCreditoId: number;
            data: { nombre?: string; descripcion?: string; creditos?: number };
        }) => creditosService.actualizarActividad(params.actividadCreditoId, params.data),
        onSuccess: () => {
            invalidarCatalogoYConfigs();
            addNotification('Actividad actualizada', 'success');
        },
        onError: () => {
            addNotification('Error al actualizar la actividad', 'error');
        },
    });

    const eliminarActividad = useMutation({
        mutationFn: (actividadCreditoId: number) =>
            creditosService.eliminarActividadCatalogo(actividadCreditoId),
        onSuccess: () => {
            invalidarCatalogoYConfigs();
            addNotification('Actividad desactivada', 'success');
        },
        onError: () => {
            addNotification('Error al desactivar la actividad', 'error');
        },
    });

    const restaurarActividad = useMutation({
        mutationFn: (actividadCreditoId: number) =>
            creditosService.restaurarActividadCatalogo(actividadCreditoId),
        onSuccess: () => {
            invalidarCatalogoYConfigs();
            addNotification('Actividad restaurada', 'success');
        },
        onError: () => {
            addNotification('Error al restaurar la actividad', 'error');
        },
    });

    return {
        categorias,
        actividades,
        crearCategoria,
        actualizarCategoria,
        eliminarCategoria,
        restaurarCategoria,
        crearActividad,
        actualizarActividad,
        eliminarActividad,
        restaurarActividad,
    };
}
