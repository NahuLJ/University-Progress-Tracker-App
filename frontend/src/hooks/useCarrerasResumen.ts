import { useQuery } from '@tanstack/react-query';
import { estadisticasService } from '../services/estadisticas.service';
import { useAuthStore } from '../store/auth.store';

export function useCarrerasResumen() {
    const usuario = useAuthStore((s) => s.usuario);
    const usuarioId = usuario?.id ?? usuario?.usuarioId;

    return useQuery({
        queryKey: ['estadisticas', 'carreras-resumen', usuarioId],
        queryFn: () => estadisticasService.obtenerCarrerasResumen(usuarioId!),
        enabled: !!usuarioId,
    });
}
