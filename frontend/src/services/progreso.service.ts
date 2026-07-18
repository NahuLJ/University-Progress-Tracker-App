import api from './api';
import type { ActualizarProgresoDto } from '../types/progreso.types';

export const progresoService = {
    async obtenerProgreso(usuarioCarreraId: number): Promise<any[]> {
        const response = await api.get('/progreso', {
            params: { usuarioCarreraId },
        });
        return response.data;
    },

    async actualizarProgreso(id: number, data: ActualizarProgresoDto): Promise<any> {
        const response = await api.patch(`/progreso/${id}`, data);
        return response.data;
    },

    async inicializarProgreso(usuarioCarreraId: number): Promise<any[]> {
        const response = await api.post('/progreso/inicializar', { usuarioCarreraId });
        return response.data;
    },
};