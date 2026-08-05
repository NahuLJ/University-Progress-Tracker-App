export interface CategoriaCredito {
    categoriaCreditoId: number;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
}

export interface MateriaRequisito {
    materiaId: number;
    nombre: string;
    codigo: string;
    aprobada: boolean;
}

export interface ActividadCredito {
    actividadCreditoId: number;
    categoriaCreditoId: number;
    categoriaNombre: string;
    nombre: string;
    descripcion: string | null;
    creditos: number;
    activo: boolean;
}

export interface CarreraCategoriaConfig {
    carreraCategoriaCreditoId: number;
    categoriaCreditoId: number;
    nombre: string;
    minimoCreditos: number;
    obtenidos: number;
    cumplida: boolean;
}

export interface CarreraActividadConfig {
    carreraActividadCreditoId: number;
    actividadCreditoId: number;
    nombre: string;
    creditos: number;
    categoriaCreditoId: number;
    categoriaNombre: string;
    progresoActividadId: number | null;
    completada: boolean;
    materiasRequeridas: MateriaRequisito[];
}

export interface CarreraCreditosConfig {
    sistemaCreditos: boolean;
    totalCreditos: number;
    creditosObtenidos: number;
    creditosFaltantes: number;
    completado: boolean;
    progresoPorcentaje: number;
    categorias: CarreraCategoriaConfig[];
    actividades: CarreraActividadConfig[];
}

export interface CreditosProgreso {
    sistemaCreditos: boolean;
    carreraId: number;
    totalRequerido: number;
    creditosObtenidos: number;
    creditosFaltantes: number;
    completado: boolean;
    progresoPorcentaje: number;
    categorias: {
        categoriaCreditoId: number;
        nombre: string;
        minimo: number;
        obtenidos: number;
        cumplida: boolean;
    }[];
    actividades: {
        progresoActividadId: number | null;
        actividadCreditoId: number;
        nombre: string;
        descripcion: string | null;
        creditos: number;
        categoriaCreditoId: number;
        categoriaNombre: string;
        completada: boolean;
        requisitos: MateriaRequisito[];
        requisitosCumplidos: boolean;
    }[];
}
