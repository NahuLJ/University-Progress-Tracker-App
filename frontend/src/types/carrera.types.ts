export interface Carrera {
    carreraId: number;
    nombre: string;
    descripcion: string | null;
    duracionAnios: number;
    activo?: boolean;
}

export interface UsuarioCarrera {
    usuarioCarreraId: number;
    usuarioId: number;
    carreraId: number;
    fechaInicio: string;
    activo: boolean;
    carrera: Carrera;
}

export interface CarreraDisponible {
    carreraId: number;
    nombre: string;
    descripcion: string | null;
    duracionAnios: number;
    creditosTotales?: number;
    inscripto: boolean;
}

export interface InscribirCarreraDto {
    carreraId: number;
    fechaInicio: string;
}

export interface CrearCarreraDto {
    nombre: string;
    descripcion?: string;
    duracionAnios: number;
}

export interface ActualizarCarreraDto {
    nombre?: string;
    descripcion?: string;
    duracionAnios?: number;
}

export interface AgregarMateriaPlanDto {
    materiaId: number;
    anio: number;
    cuatrimestre: number;
    orden: number;
}

export interface ActualizarMateriaPlanDto {
    anio?: number;
    cuatrimestre?: number;
    orden?: number;
}

export interface Correlativa {
    correlativaId: number;
    materiaId: number;
    materiaCorrelativaId: number;
    materiaCorrelativa: {
        materiaId: number;
        nombre: string;
        codigo: string;
    };
    estadoUsuario: string | null;
    nota: number | null;
    tipoAprobacion: string | null;
}

export interface MateriaPlanEstudios {
    materiaId: number;
    carreraMateriaId: number;
    nombre: string;
    codigo: string;
    descripcion: string | null;
    cargaHoraria: number;
    creditos: number;
    anio: number;
    cuatrimestre: number;
    orden: number;
    estadoUsuario: string | null;
    nota: number | null;
    tipoAprobacion: string | null;
    correlativas: Correlativa[];
    esCorrelativaDe?: {
        materiaId: number;
        nombre: string;
        codigo: string;
        creditos: number;
        estadoUsuario: string | null;
        nota: number | null;
        tipoAprobacion: string | null;
    }[];
}

export interface PlanEstudios {
    carrera: Carrera;
    materias: MateriaPlanEstudios[];
    anios: {
        anio: number;
        cuatrimestres: {
            cuatrimestre: number;
            materias: MateriaPlanEstudios[];
        }[];
    }[];
}

export interface CarreraAdminRow {
    carreraId: number;
    nombre: string;
    descripcion: string | null;
    duracionAnios: number;
    activo: boolean;
    totalMaterias?: number;
}

export interface CarreraAdminFilters {
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    incluirInactivos?: boolean;
    page?: number;
    limit?: number;
}