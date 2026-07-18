export { ProgresoGrid } from './ProgresoGrid';
export { FiltroEstado, FiltroBusqueda } from './Filtros';
export { CarrerasResumenList } from './CarrerasResumenList';

export function ProgresoStatsBar({ totales }: { totales: { completadas: number; enProceso: number; pendientes: number } }) {
    return (
        <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                {totales.completadas} Completadas
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                {totales.enProceso} En Proceso
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                {totales.pendientes} Pendientes
            </span>
        </div>
    );
}