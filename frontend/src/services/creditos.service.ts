import api from './api';
import type {
    CategoriaCredito,
    ActividadCredito,
    CarreraCreditosConfig,
    CreditosProgreso,
} from '../types/creditos.types';

export const creditosService = {
    // catálogo
    async listarCategorias(incluirInactivas?: boolean): Promise<CategoriaCredito[]> {
        const response = await api.get('/creditos/categorias', {
            params: incluirInactivas ? { incluirInactivas } : undefined,
        });
        return response.data;
    },

    async crearCategoria(data: { nombre: string; descripcion?: string }): Promise<CategoriaCredito> {
        const response = await api.post('/creditos/categorias', data);
        return response.data;
    },

    async listarActividades(categoriaId?: number, search?: string): Promise<ActividadCredito[]> {
        const response = await api.get('/creditos/actividades', {
            params: {
                ...(categoriaId ? { categoriaId } : {}),
                ...(search ? { search } : {}),
            },
        });
        return response.data;
    },

    async crearActividad(data: {
        nombre: string;
        descripcion?: string;
        categoriaCreditoId: number;
        creditos: number;
        materiasRequeridas?: number[];
    }): Promise<ActividadCredito> {
        const response = await api.post('/creditos/actividades', data);
        return response.data;
    },

    async actualizarActividad(
        actividadCreditoId: number,
        data: { nombre?: string; descripcion?: string; creditos?: number; materiasRequeridas?: number[] },
    ): Promise<ActividadCredito> {
        const response = await api.put(`/creditos/actividades/${actividadCreditoId}`, data);
        return response.data;
    },

    // configuración de la carrera
    async obtenerConfiguracionCarrera(
        carreraId: number,
        usuarioCarreraId?: number,
    ): Promise<CarreraCreditosConfig> {
        const response = await api.get(`/carreras/${carreraId}/creditos`, {
            params: usuarioCarreraId ? { usuarioCarreraId } : undefined,
        });
        return response.data;
    },

    async actualizarSistema(
        carreraId: number,
        data: { creditosHabilitado: boolean; totalCreditos?: number },
    ): Promise<void> {
        await api.put(`/carreras/${carreraId}/creditos`, data);
    },

    async agregarCategoria(
        carreraId: number,
        data: { categoriaCreditoId: number; minimoCreditos: number },
    ): Promise<void> {
        await api.post(`/carreras/${carreraId}/creditos/categorias`, data);
    },

    async actualizarCategoria(
        carreraId: number,
        carreraCategoriaCreditoId: number,
        data: { minimoCreditos: number },
    ): Promise<void> {
        await api.put(`/carreras/${carreraId}/creditos/categorias/${carreraCategoriaCreditoId}`, data);
    },

    async quitarCategoria(carreraId: number, carreraCategoriaCreditoId: number): Promise<void> {
        await api.delete(`/carreras/${carreraId}/creditos/categorias/${carreraCategoriaCreditoId}`);
    },

    async agregarActividad(carreraId: number, data: { actividadCreditoId: number }): Promise<void> {
        await api.post(`/carreras/${carreraId}/creditos/actividades`, data);
    },

    async quitarActividad(carreraId: number, carreraActividadCreditoId: number): Promise<void> {
        await api.delete(`/carreras/${carreraId}/creditos/actividades/${carreraActividadCreditoId}`);
    },

    // progreso del usuario
    async obtenerProgreso(usuarioCarreraId: number): Promise<CreditosProgreso> {
        const response = await api.get('/creditos/progreso', {
            params: { usuarioCarreraId },
        });
        return response.data;
    },

    async marcarCompletada(usuarioCarreraId: number, actividadCreditoId: number): Promise<void> {
        await api.post('/creditos/progreso', { usuarioCarreraId, actividadCreditoId });
    },

    async desmarcar(progresoActividadId: number): Promise<void> {
        await api.delete(`/creditos/progreso/${progresoActividadId}`);
    },
};
