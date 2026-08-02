import api from './api';
import type {
    UsuarioCarrera,
    CarreraDisponible,
    PlanEstudios,
    InscribirCarreraDto,
    CrearCarreraDto,
    ActualizarCarreraDto,
    AgregarMateriaPlanDto,
    ActualizarMateriaPlanDto,
    CarreraAdminRow,
    CarreraAdminFilters,
} from '../types/carrera.types';
import type { Materia, CrearMateriaDto, ActualizarMateriaDto, AsignarCorrelativaDto, MateriaDetalle, MateriaAdminRow, MateriaAdminFilters } from '../types/materia.types';
import type { PaginatedResponse } from '../types/api.types';

export const carrerasService = {
    async obtenerCarrerasDelUsuario(usuarioId: number): Promise<UsuarioCarrera[]> {
        const response = await api.get(`/usuarios/${usuarioId}/carreras`);
        return response.data.data;
    },

    async obtenerCarrerasDelUsuarioPaginado(usuarioId: number, page: number = 1, limit: number = 12): Promise<PaginatedResponse<UsuarioCarrera>> {
        const response = await api.get(`/usuarios/${usuarioId}/carreras`, {
            params: { page, limit },
        });
        return response.data;
    },

    async obtenerCarrerasActivasDelUsuario(usuarioId: number): Promise<UsuarioCarrera[]> {
        const response = await api.get(`/usuarios/${usuarioId}/carreras-activas`);
        return response.data.data;
    },

    async obtenerCarrerasActivasDelUsuarioPaginado(usuarioId: number, page: number = 1, limit: number = 12): Promise<PaginatedResponse<UsuarioCarrera>> {
        const response = await api.get(`/usuarios/${usuarioId}/carreras-activas`, {
            params: { page, limit },
        });
        return response.data;
    },

    async obtenerCarrerasInactivasDelUsuarioPaginado(usuarioId: number, page: number = 1, limit: number = 12): Promise<PaginatedResponse<UsuarioCarrera>> {
        const response = await api.get(`/usuarios/${usuarioId}/carreras-inactivas`, {
            params: { page, limit },
        });
        return response.data;
    },

    async obtenerCarrerasDisponibles(): Promise<CarreraDisponible[]> {
        const response = await api.get('/carreras');
        return response.data;
    },

    async obtenerCarrerasDisponiblesParaUsuario(usuarioId: number, page: number = 1, limit: number = 12): Promise<PaginatedResponse<CarreraDisponible>> {
        const response = await api.get(`/carreras/disponibles/${usuarioId}`, {
            params: { page, limit },
        });
        return response.data;
    },

    async obtenerPlanEstudios(carreraId: number, usuarioCarreraId?: number): Promise<PlanEstudios> {
        const response = await api.get(`/carreras/${carreraId}/plan-estudios`, {
            params: usuarioCarreraId ? { usuarioCarreraId } : undefined,
        });
        return response.data;
    },

    async inscribirCarrera(usuarioId: number, data: InscribirCarreraDto): Promise<UsuarioCarrera> {
        const response = await api.post(`/usuarios/${usuarioId}/carreras`, data);
        return response.data;
    },

    async desinscribirCarrera(usuarioId: number, usuarioCarreraId: number): Promise<void> {
        await api.delete(`/usuarios/${usuarioId}/carreras/${usuarioCarreraId}`);
    },

    async reactivarCarrera(usuarioId: number, usuarioCarreraId: number): Promise<UsuarioCarrera> {
        const response = await api.patch(`/usuarios/${usuarioId}/carreras/${usuarioCarreraId}/reactivar`);
        return response.data;
    },

    async eliminarCarreraDefinitivamente(usuarioId: number, usuarioCarreraId: number): Promise<void> {
        await api.delete(`/usuarios/${usuarioId}/carreras/${usuarioCarreraId}/definitivo`);
    },

    // --- Administración (solo admin) ---
    async crearCarrera(data: CrearCarreraDto): Promise<{ carreraId: number }> {
        const response = await api.post('/carreras', data);
        return response.data;
    },

    async agregarMateriaAlPlan(carreraId: number, data: AgregarMateriaPlanDto): Promise<void> {
        await api.post(`/carreras/${carreraId}/materias`, data);
    },

    async actualizarMateriaEnPlan(carreraId: number, carreraMateriaId: number, data: ActualizarMateriaPlanDto): Promise<void> {
        await api.put(`/carreras/${carreraId}/materias/${carreraMateriaId}`, data);
    },

    async listarCarrerasAdmin(params?: CarreraAdminFilters): Promise<PaginatedResponse<CarreraAdminRow>> {
        const response = await api.get('/carreras', { params });
        return response.data;
    },

    async actualizarCarrera(id: number, data: ActualizarCarreraDto): Promise<CarreraAdminRow> {
        const response = await api.put(`/carreras/${id}`, data);
        return response.data;
    },

    async eliminarCarrera(id: number): Promise<void> {
        await api.delete(`/carreras/${id}`);
    },

    async restaurarCarrera(id: number): Promise<CarreraAdminRow> {
        const response = await api.patch(`/carreras/${id}/restore`);
        return response.data;
    },

    async quitarMateriaDelPlan(carreraId: number, carreraMateriaId: number): Promise<void> {
        await api.delete(`/carreras/${carreraId}/materias/${carreraMateriaId}`);
    },

    async obtenerCarrera(id: number): Promise<CarreraAdminRow> {
        const response = await api.get(`/carreras/${id}`);
        return response.data;
    },
};

export const materiasAdminService = {
    async listarMateriasAdmin(params?: MateriaAdminFilters): Promise<PaginatedResponse<MateriaAdminRow>> {
        const response = await api.get('/materias', { params });
        return response.data;
    },

    async obtenerMateria(id: number, carreraId?: number): Promise<MateriaDetalle> {
        const response = await api.get(`/materias/${id}`, {
            params: carreraId ? { carreraId } : undefined,
        });
        return response.data;
    },

    async crearMateria(data: CrearMateriaDto): Promise<Materia> {
        const response = await api.post('/materias', data);
        return response.data;
    },

    async actualizarMateria(id: number, data: ActualizarMateriaDto): Promise<Materia> {
        const response = await api.put(`/materias/${id}`, data);
        return response.data;
    },

    async eliminarMateria(id: number): Promise<void> {
        await api.delete(`/materias/${id}`);
    },

    async restaurarMateria(id: number): Promise<Materia> {
        const response = await api.patch(`/materias/${id}/restore`);
        return response.data;
    },

    async asignarCorrelativa(materiaId: number, data: AsignarCorrelativaDto): Promise<void> {
        await api.post(`/materias/${materiaId}/correlativas`, data);
    },

    async eliminarCorrelativa(materiaId: number, correlativaId: number, carreraId?: number): Promise<void> {
        await api.delete(`/materias/${materiaId}/correlativas/${correlativaId}`, {
            params: carreraId ? { carreraId } : undefined,
        });
    },
};