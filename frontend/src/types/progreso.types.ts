export interface EstadoMateria {
    estadoId: number;
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
    materiaId: number;
    nota: number | null;
    tipoAprobacion: 'Final' | 'Promocion' | null;
    estado: EstadoMateria;
    materia: Materia;
    anio: number;
    cuatrimestre: number;
    orden: number;
}

export interface ActualizarProgresoDto {
    estado: 'Pendiente' | 'En Proceso' | 'Completada';
    nota?: number;
    tipoAprobacion?: 'Final' | 'Promocion';
}

export interface InicializarProgresoDto {
    usuarioCarreraId: number;
}