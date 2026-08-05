import api from './api';
import type {
    EstadisticasResumen,
    DistribucionEstados,
    EvolucionPromedio,
    CarreraResumen,
    NotasDistribucion,
    ProgresoPorAnio,
} from '../types/estadisticas.types';
import type { CreditosProgreso } from '../types/creditos.types';

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

    async obtenerNotasDistribucion(usuarioCarreraId: number): Promise<NotasDistribucion> {
        const response = await api.get('/estadisticas/notas-distribucion', {
            params: { usuarioCarreraId },
        });
        return response.data;
    },

    async obtenerProgresoPorAnio(usuarioCarreraId: number): Promise<ProgresoPorAnio[]> {
        const response = await api.get('/estadisticas/progreso-por-anio', {
            params: { usuarioCarreraId },
        });
        return response.data;
    },

    async obtenerCreditosProgreso(usuarioCarreraId: number): Promise<CreditosProgreso> {
        const response = await api.get('/estadisticas/creditos-progreso', {
            params: { usuarioCarreraId },
        });
        return response.data;
    },
};