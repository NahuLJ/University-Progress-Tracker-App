export interface Materia {
    materiaId: number;
    nombre: string;
    codigo: string;
    descripcion: string | null;
    cargaHoraria: number;
    creditos: number;
}

export interface CrearMateriaDto {
    nombre: string;
    codigo: string;
    descripcion?: string;
    cargaHoraria: number;
    creditos: number;
}

export interface AsignarCorrelativaDto {
    materiaCorrelativaId: number;
}

export interface Correlativa {
    correlativaId: number;
    materiaId: number;
    materiaCorrelativaId: number;
    materiaCorrelativa: Materia;
}

export interface MateriaDetalle extends Materia {
    correlativas: Correlativa[];
}