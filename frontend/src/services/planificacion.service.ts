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
    Trayectoria,
    CrearTrayectoriaDto,
    ActualizarTrayectoriaDto,
    NodoTrayectoria,
    MateriaImpactada,
    EliminarMateriaResultado,
} from '../types/planificacion.types';
import type { PaginatedResponse } from '../types/api.types';

export const planificacionService = {
    // ── Materias disponibles ──
    async obtenerMateriasDisponibles(
        usuarioCarreraId: number,
        trayectoriaId?: number,
        periodoId?: number,
    ): Promise<MateriaEnCelda[]> {
        const params: Record<string, string | number> = { usuarioCarreraId };
        if (trayectoriaId !== undefined) params.trayectoriaId = trayectoriaId;
        if (periodoId !== undefined) params.periodoId = periodoId;
        const response = await api.get('/planificacion/disponibles', { params });
        return response.data.map((m: any) => ({
            planificacionId: 0,
            materiaId: m.materiaId,
            nombre: m.nombre,
            codigo: m.codigo,
            creditos: m.creditos,
            cargaHoraria: m.cargaHoraria,
        }));
    },

    // ── Periodos ──
    async listarPeriodos(usuarioCarreraId: number, independientes?: boolean): Promise<PeriodoPlanificacion[]> {
        const response = await api.get('/planificacion/periodos', {
            params: { usuarioCarreraId, independientes },
        });
        return response.data;
    },

    async listarPeriodosPaginado(
        usuarioCarreraId: number,
        page: number = 1,
        limit: number = 12,
        independientes?: boolean,
    ): Promise<PaginatedResponse<PeriodoPlanificacion>> {
        const response = await api.get('/planificacion/periodos-paginado', {
            params: { usuarioCarreraId, page, limit, independientes },
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

    // ── Bloques ──
    async obtenerBloques(): Promise<BloqueHorario[]> {
        const response = await api.get('/planificacion/bloques');
        return response.data;
    },

    // ── Materias del periodo ──
    async obtenerMateriasDelPeriodo(periodoId: number): Promise<MateriaPlanificada[]> {
        const response = await api.get(`/planificacion/periodos/${periodoId}/materias`);
        return response.data;
    },

    // ── Planificar materia ──
    async planificarMateria(periodoId: number, data: PlanificarMateriaDto): Promise<MateriaPlanificada> {
        const response = await api.post(`/planificacion/periodos/${periodoId}/materias`, data);
        return response.data;
    },

    // ── Materias desbloqueables ──
    async obtenerMateriasDesbloqueables(periodoId: number, materiaIds?: number[]): Promise<MateriaDesbloqueable[]> {
        const response = await api.get(`/planificacion/periodos/${periodoId}/materias-desbloqueables`, {
            params: materiaIds !== undefined ? { materiaIds: materiaIds.join(',') } : undefined,
        });
        return response.data;
    },

    // ── Eliminar materia planificada (con modo cascade) ──
    async eliminarMateriaPlanificada(
        planificacionId: number,
        modo?: 'simple' | 'cascade',
    ): Promise<EliminarMateriaResultado> {
        const params: Record<string, string> = {};
        if (modo) params.modo = modo;
        const response = await api.delete(`/planificacion/materias/${planificacionId}`, { params });
        return response.data;
    },

    // ── Impacto de eliminacion ──
    async obtenerImpactoEliminacion(materiaPlanificadaId: number): Promise<MateriaImpactada[]> {
        const response = await api.get(`/planificacion/materias/${materiaPlanificadaId}/impacto`);
        return response.data;
    },

    // ── Inconsistencias ──
    async verificarInconsistencias(periodoId: number): Promise<MateriaImpactada[]> {
        const response = await api.get(`/planificacion/periodos/${periodoId}/inconsistencias`);
        return response.data;
    },

    // ── Trayectorias ──
    async listarTrayectorias(usuarioCarreraId: number): Promise<Trayectoria[]> {
        const response = await api.get('/trayectorias', {
            params: { usuarioCarreraId },
        });
        return response.data;
    },

    async crearTrayectoria(data: CrearTrayectoriaDto): Promise<Trayectoria> {
        const response = await api.post('/trayectorias', data);
        return response.data;
    },

    async actualizarTrayectoria(id: number, data: ActualizarTrayectoriaDto): Promise<Trayectoria> {
        const response = await api.patch(`/trayectorias/${id}`, data);
        return response.data;
    },

    async eliminarTrayectoria(id: number): Promise<void> {
        await api.delete(`/trayectorias/${id}`);
    },

    async obtenerArbolTrayectoria(id: number): Promise<NodoTrayectoria> {
        const response = await api.get(`/trayectorias/${id}/arbol`);
        return response.data;
    },

    async listarPlanificacionesDeTrayectoria(trayectoriaId: number): Promise<PeriodoPlanificacion[]> {
        const response = await api.get(`/trayectorias/${trayectoriaId}/planificaciones`);
        return response.data;
    },
};