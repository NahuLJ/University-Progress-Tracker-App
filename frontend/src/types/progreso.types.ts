export interface EstadoMateria {
    estadoMateriaId: number;
    nombre: 'Pendiente' | 'En Proceso' | 'Completada';
}

export interface Materia {
    materiaId: number;
    nombre: string;
    codigo: string;
    creditos: number;
}

export interface Progreso {
    progresoId: number;
    usuarioCarreraId: number;
    materiaId: number;
    estadoMateriaId: number;
    estado: EstadoMateria;
    nota: number | null;
    tipoAprobacion: 'Final' | 'Promocion' | null;
    materia: Materia;
}

export interface ActualizarProgresoDto {
    estado: 'Pendiente' | 'En Proceso' | 'Completada';
    nota?: number;
    tipoAprobacion?: 'Final' | 'Promocion';
}

export interface InicializarProgresoDto {
    usuarioCarreraId: number;
}