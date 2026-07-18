import api from './api';
import type {
    UsuarioCarrera,
    CarreraDisponible,
    PlanEstudios,
    InscribirCarreraDto,
    CrearCarreraDto,
    AgregarMateriaPlanDto,
} from '../types/carrera.types';
import type { Materia, CrearMateriaDto, AsignarCorrelativaDto, MateriaDetalle } from '../types/materia.types';

export const carrerasService = {
    async obtenerCarrerasDelUsuario(usuarioId: number): Promise<UsuarioCarrera[]> {
        const response = await api.get(`/usuarios/${usuarioId}/carreras`);
        return response.data;
    },

    async obtenerCarrerasDisponibles(): Promise<CarreraDisponible[]> {
        const response = await api.get('/carreras');
        return response.data;
    },

    async obtenerPlanEstudios(carreraId: number): Promise<PlanEstudios> {
        const response = await api.get(`/carreras/${carreraId}/plan-estudios`);
        return response.data;
    },

    async inscribirCarrera(usuarioId: number, data: InscribirCarreraDto): Promise<UsuarioCarrera> {
        const response = await api.post(`/usuarios/${usuarioId}/carreras`, data);
        return response.data;
    },

    async desinscribirCarrera(usuarioId: number, usuarioCarreraId: number): Promise<void> {
        await api.delete(`/usuarios/${usuarioId}/carreras/${usuarioCarreraId}`);
    },

    // --- Administración (solo admin) ---
    async crearCarrera(data: CrearCarreraDto): Promise<{ carreraId: number }> {
        const response = await api.post('/carreras', data);
        return response.data;
    },

    async agregarMateriaAlPlan(carreraId: number, data: AgregarMateriaPlanDto): Promise<void> {
        await api.post(`/carreras/${carreraId}/materias`, data);
    },
};

export const materiasAdminService = {
    async listarMaterias(): Promise<Materia[]> {
        const response = await api.get('/materias');
        return response.data;
    },

    async obtenerMateria(id: number): Promise<MateriaDetalle> {
        const response = await api.get(`/materias/${id}`);
        return response.data;
    },

    async crearMateria(data: CrearMateriaDto): Promise<Materia> {
        const response = await api.post('/materias', data);
        return response.data;
    },

    async asignarCorrelativa(materiaId: number, data: AsignarCorrelativaDto): Promise<void> {
        await api.post(`/materias/${materiaId}/correlativas`, data);
    },

    async eliminarCorrelativa(materiaId: number, correlativaId: number): Promise<void> {
        await api.delete(`/materias/${materiaId}/correlativas/${correlativaId}`);
    },
};
