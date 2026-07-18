import api from './api';
import type {
    PeriodoPlanificacion,
    MateriaPlanificada,
    BloqueHorario,
    CrearPeriodoDto,
    PlanificarMateriaDto,
    MateriaDesbloqueable,
} from '../types/planificacion.types';

export const planificacionService = {
    async listarPeriodos(usuarioCarreraId: number): Promise<PeriodoPlanificacion[]> {
        const response = await api.get('/planificacion/periodos', {
            params: { usuarioCarreraId },
        });
        return response.data;
    },

    async crearPeriodo(data: CrearPeriodoDto): Promise<PeriodoPlanificacion> {
        const response = await api.post('/planificacion/periodos', data);
        return response.data;
    },

    async eliminarPeriodo(id: number): Promise<void> {
        await api.delete(`/planificacion/periodos/${id}`);
    },

    async obtenerBloques(): Promise<BloqueHorario[]> {
        const response = await api.get('/planificacion/bloques');
        return response.data;
    },

    async obtenerMateriasDelPeriodo(periodoId: number): Promise<MateriaPlanificada[]> {
        const response = await api.get(`/planificacion/periodos/${periodoId}/materias`);
        return response.data;
    },

    async planificarMateria(periodoId: number, data: PlanificarMateriaDto): Promise<MateriaPlanificada> {
        const response = await api.post(`/planificacion/periodos/${periodoId}/materias`, data);
        return response.data;
    },

    async obtenerMateriasDesbloqueables(periodoId: number): Promise<MateriaDesbloqueable[]> {
        const response = await api.get(`/planificacion/periodos/${periodoId}/materias-desbloqueables`);
        return response.data;
    },

    async eliminarMateriaPlanificada(planificacionId: number): Promise<void> {
        await api.delete(`/planificacion/materias/${planificacionId}`);
    },
};