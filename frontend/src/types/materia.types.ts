export interface Materia {
    materiaId: number;
    nombre: string;
    codigo: string;
    descripcion: string | null;
    cargaHoraria: number;
    creditos: number;
    activo?: boolean;
}

export interface CrearMateriaDto {
    nombre: string;
    codigo: string;
    descripcion?: string;
    cargaHoraria: number;
    creditos: number;
}

export interface ActualizarMateriaDto {
    nombre?: string;
    codigo?: string;
    descripcion?: string;
    cargaHoraria?: number;
    creditos?: number;
}

export interface AsignarCorrelativaDto {
    materiaCorrelativaId: number;
    carreraId?: number;
}

export interface Correlativa {
    correlativaId: number;
    materiaId: number;
    materiaCorrelativaId: number;
    materiaCorrelativa: Materia;
    carrera: {
        carreraId: number;
        nombre: string;
    };
}

export interface MateriaDetalle extends Materia {
    correlativas: Correlativa[];
    esCorrelativaDe: Correlativa[];
    carreras?: {
        carreraId: number;
        nombre: string;
        anio: number;
        cuatrimestre: number;
        orden: number;
    }[];
}

export interface MateriaAdminRow extends Materia {
    activo: boolean;
    totalCarreras: number;
}

export interface MateriaAdminFilters {
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    incluirInactivos?: boolean;
    page?: number;
    limit?: number;
}