export function formatearFecha(fecha: string | Date): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function formatearPromedio(promedio: number | null): string {
    if (promedio === null || promedio === undefined) return '—';
    return promedio.toFixed(2);
}

export function obtenerColorPromedio(promedio: number | null): string {
    if (promedio === null || promedio === undefined) return 'text-gray-500';
    if (promedio >= 8.5) return 'text-blue-600';
    if (promedio >= 7) return 'text-green-600';
    if (promedio >= 6) return 'text-yellow-600';
    return 'text-orange-600';
}

export function obtenerEtiquetaPromedio(promedio: number | null): string {
    if (promedio === null || promedio === undefined) return 'Sin datos';
    if (promedio >= 8.5) return 'Excelente';
    if (promedio >= 7) return 'Bueno';
    if (promedio >= 6) return 'Aceptable';
    return 'Bajo';
}

export function formatearCuatrimestres(cuatrimestres: number | null): string {
    if (cuatrimestres === null || cuatrimestres === undefined) return '—';
    const anios = Math.floor(cuatrimestres / 2);
    const cuats = cuatrimestres % 2;
    if (anios > 0 && cuats > 0) return `≈ ${anios} años y ${cuats} cuatrimestre`;
    if (anios > 0) return `≈ ${anios} años`;
    return `${cuats} cuatrimestre${cuats > 1 ? 's' : ''}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    ms: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), ms);
    };
}