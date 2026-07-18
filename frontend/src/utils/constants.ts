export const BLOQUES_HORARIOS = [
    { id: 1, inicio: '08:00', fin: '10:00', label: '08-10' },
    { id: 2, inicio: '10:00', fin: '12:00', label: '10-12' },
    { id: 3, inicio: '12:00', fin: '14:00', label: '12-14' },
    { id: 4, inicio: '14:00', fin: '16:00', label: '14-16' },
    { id: 5, inicio: '16:00', fin: '18:00', label: '16-18' },
    { id: 6, inicio: '18:00', fin: '20:00', label: '18-20' },
    { id: 7, inicio: '20:00', fin: '22:00', label: '20-22' },
] as const;

export const DIAS_SEMANA = [
    { id: 1, nombre: 'Lunes', corto: 'Lun' },
    { id: 2, nombre: 'Martes', corto: 'Mar' },
    { id: 3, nombre: 'Miércoles', corto: 'Mié' },
    { id: 4, nombre: 'Jueves', corto: 'Jue' },
    { id: 5, nombre: 'Viernes', corto: 'Vie' },
    { id: 6, nombre: 'Sábado', corto: 'Sáb' },
] as const;

export const ESTADOS_MATERIA = [
    { id: 1, nombre: 'Pendiente', color: 'bg-red-100 text-red-700', emoji: '🔴' },
    { id: 2, nombre: 'En Proceso', color: 'bg-yellow-100 text-yellow-700', emoji: '🟡' },
    { id: 3, nombre: 'Completada', color: 'bg-green-100 text-green-700', emoji: '🟢' },
] as const;

export const INSTANCIAS_PERIODO = [
    'Verano',
    '1er Cuatrimestre',
    '2do Cuatrimestre',
] as const;

export const TIPO_CORRELATIVA = {
    CURSADA: 'CURSADA',
    APROBACION: 'APROBACION',
} as const;

export const TIPO_APROBACION = {
    FINAL: 'Final',
    PROMOCION: 'Promoción',
} as const;