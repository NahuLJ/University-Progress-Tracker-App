import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { useCarreraStore } from '../store/carrera.store';
import { estadisticasService } from '../services/estadisticas.service';
import { useCarreras } from './useCarreras';

export function useDashboard() {
    const usuario = useAuthStore((s) => s.usuario);
    const usuarioCarreraId = useCarreraStore((s) => s.usuarioCarreraId);
    const setUsuarioCarreraId = useCarreraStore((s) => s.setUsuarioCarreraId);

    const { data: carreras, isLoading: cargandoCarreras } = useCarreras();

    useEffect(() => {
        if (!carreras || carreras.length === 0) return;
        if (!usuarioCarreraId || !carreras.some((c) => c.usuarioCarreraId === usuarioCarreraId)) {
            const activa = carreras.find((c) => c.activo) ?? carreras[0];
            if (activa) setUsuarioCarreraId(activa.usuarioCarreraId);
        }
    }, [carreras, usuarioCarreraId, setUsuarioCarreraId]);

    const { data: resumen, isLoading: cargandoResumen, error: errorResumen } = useQuery({
        queryKey: ['estadisticas', 'resumen', usuarioCarreraId],
        queryFn: () => estadisticasService.obtenerResumen(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    const { data: distribucion, isLoading: cargandoDistribucion } = useQuery({
        queryKey: ['estadisticas', 'distribucion', usuarioCarreraId],
        queryFn: () => estadisticasService.obtenerDistribucionEstados(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    const { data: evolucion, isLoading: cargandoEvolucion } = useQuery({
        queryKey: ['estadisticas', 'evolucion', usuarioCarreraId],
        queryFn: () => estadisticasService.obtenerEvolucion(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    return {
        usuario,
        carreras,
        usuarioCarreraId,
        setUsuarioCarreraId,
        resumen,
        distribucion,
        evolucion,
        error: errorResumen,
        isLoading: cargandoCarreras || cargandoResumen || cargandoDistribucion || cargandoEvolucion,
    };
}
