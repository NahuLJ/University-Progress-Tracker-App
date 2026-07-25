export interface BloqueHorario {
    bloqueId: number;
    horaInicio: string;
    horaFin: string;
}

export interface PeriodoPlanificacion {
    periodoId: number;
    usuarioCarreraId: number;
    anio: number;
    instancia: 'Verano' | '1er Cuatrimestre' | '2do Cuatrimestre';
    nombre: string;
    creadoEn: string;
    materiasPlanificadas: MateriaPlanificada[];
}

export interface CrearPeriodoDto {
    usuarioCarreraId: number;
    anio: number;
    instancia: 'Verano' | '1er Cuatrimestre' | '2do Cuatrimestre';
    nombre: string;
}

export interface PlanificarMateriaDto {
    materiaId: number;
    bloqueId: number;
    diaSemana: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
}

export interface MateriaPlanificada {
    planificacionId: number;
    periodoId: number;
    materiaId: number;
    bloqueId: number;
    diaSemana: string;
    bloque: BloqueHorario;
    materia: MateriaEnCelda;
}

export interface MateriaEnCelda {
    planificacionId: number;
    materiaId: number;
    nombre: string;
    codigo: string;
    creditos: number;
    cargaHoraria: number;
}

export const HORAS_POR_BLOQUE = 2;

export function horasAsignadas(materiaId: number, celdas: Record<string, MateriaEnCelda | null>): number {
    let total = 0;
    for (const m of Object.values(celdas)) {
        if (m?.materiaId === materiaId) total += HORAS_POR_BLOQUE;
    }
    return total;
}

export interface MateriaDesbloqueable {
    materiaId: number;
    nombre: string;
    codigo: string;
    creditos: number;
    correlativasCumplidas: number;
    correlativasTotal: number;
    correlativas: {
        materiaId: number;
        nombre: string;
        codigo: string;
        estado: 'Pendiente' | 'En Proceso' | 'Completada';
    }[];
}