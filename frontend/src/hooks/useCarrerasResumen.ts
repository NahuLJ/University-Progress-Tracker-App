import { useQuery } from '@tanstack/react-query';
import { estadisticasService } from '../services/estadisticas.service';
import { useAuthStore } from '../store/auth.store';
import type { CarreraResumen } from '../types/estadisticas.types';

export function useCarrerasResumen() {
    const usuario = useAuthStore((s) => s.usuario);

    return useQuery<CarreraResumen[]>({
        queryKey: ['estadisticas', 'carreras-resumen', usuario?.id],
        queryFn: () => estadisticasService.obtenerCarrerasResumen(usuario!.id),
        enabled: !!usuario,
    });
}
