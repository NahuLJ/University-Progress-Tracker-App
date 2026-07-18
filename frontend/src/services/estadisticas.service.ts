import api from './api';
import type {
    EstadisticasResumen,
    DistribucionEstados,
    EvolucionPromedio,
    CarreraResumen,
} from '../types/estadisticas.types';

export const estadisticasService = {
    async obtenerResumen(usuarioCarreraId: number): Promise<EstadisticasResumen> {
        const response = await api.get('/estadisticas/resumen', {
            params: { usuarioCarreraId },
        });
        return response.data;
    },

    async obtenerDistribucionEstados(usuarioCarreraId: number): Promise<DistribucionEstados[]> {
        const response = await api.get('/estadisticas/distribucion-estados', {
            params: { usuarioCarreraId },
        });
        return response.data;
    },

    async obtenerEvolucion(usuarioCarreraId: number): Promise<EvolucionPromedio[]> {
        const response = await api.get('/estadisticas/evolucion', {
            params: { usuarioCarreraId },
        });
        return response.data;
    },

    async obtenerCarrerasResumen(usuarioId: number): Promise<CarreraResumen[]> {
        const response = await api.get('/estadisticas/carreras-resumen', {
            params: { usuarioId },
        });
        return response.data;
    },
};