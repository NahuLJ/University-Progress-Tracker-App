export interface EstadisticasResumen {
    promedioGeneral: number | null;
    cuatrimestresRestantes: number;
    creditosObtenidos: number;
    creditosTotales: number;
    progresoPorcentaje: number;
    materiasCompletadas: number;
    materiasTotales: number;
}

export interface DistribucionEstados {
    estado: 'Pendiente' | 'En Proceso' | 'Completada';
    cantidad: number;
    porcentaje: number;
}

export interface EvolucionPromedio {
    fecha: string;
    promedio: number;
    cuatrimestre: string;
}

export interface CarreraResumen {
    usuarioCarreraId: number;
    carrera: {
        carreraId: number;
        nombre: string;
    };
    activo: boolean;
    materiasCompletadas: number;
    materiasTotales: number;
    progresoPorcentaje: number;
    promedioGeneral: number | null;
}