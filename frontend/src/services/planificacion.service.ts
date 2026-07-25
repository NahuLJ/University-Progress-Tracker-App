import api from './api';
import type {
    PeriodoPlanificacion,
    MateriaPlanificada,
    MateriaEnCelda,
    BloqueHorario,
    CrearPeriodoDto,
    PlanificarMateriaDto,
    MateriaDesbloqueable,
    ActualizarPeriodoDto,
} from '../types/planificacion.types';
import type { PaginatedResponse } from '../types/api.types';

export const planificacionService = {
    async obtenerMateriasDisponibles(usuarioCarreraId: number): Promise<MateriaEnCelda[]> {
        const response = await api.get('/planificacion/disponibles', {
            params: { usuarioCarreraId },
        });
        return response.data.map((m: any) => ({
            planificacionId: 0,
            materiaId: m.materiaId,
            nombre: m.nombre,
            codigo: m.codigo,
            creditos: m.creditos,
            cargaHoraria: m.cargaHoraria,
        }));
    },

    async listarPeriodos(usuarioCarreraId: number): Promise<PeriodoPlanificacion[]> {
        const response = await api.get('/planificacion/periodos', {
            params: { usuarioCarreraId },
        });
        return response.data;
    },

    async listarPeriodosPaginado(
        usuarioCarreraId: number,
        page: number = 1,
        limit: number = 12,
    ): Promise<PaginatedResponse<PeriodoPlanificacion>> {
        const response = await api.get('/planificacion/periodos-paginado', {
            params: { usuarioCarreraId, page, limit },
        });
        return response.data;
    },

    async crearPeriodo(data: CrearPeriodoDto): Promise<PeriodoPlanificacion> {
        const response = await api.post('/planificacion/periodos', data);
        return response.data;
    },

    async actualizarPeriodo(id: number, data: ActualizarPeriodoDto): Promise<PeriodoPlanificacion> {
        const response = await api.patch(`/planificacion/periodos/${id}`, data);
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

    async obtenerMateriasDesbloqueables(periodoId: number, materiaIds?: number[]): Promise<MateriaDesbloqueable[]> {
        const response = await api.get(`/planificacion/periodos/${periodoId}/materias-desbloqueables`, {
            params: materiaIds !== undefined ? { materiaIds: materiaIds.join(',') } : undefined,
        });
        return response.data;
    },

    async eliminarMateriaPlanificada(planificacionId: number): Promise<void> {
        await api.delete(`/planificacion/materias/${planificacionId}`);
    },
};