export { ProgresoGrid } from './ProgresoGrid';
export { FiltroEstado, FiltroBusqueda } from './Filtros';
export { CarrerasResumenList } from './CarrerasResumenList';

export function ProgresoStatsBar({ totales }: { totales: { completadas: number; enProceso: number; pendientes: number } }) {
    return (
        <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-neon-green/15 text-neon-green border border-neon-green/30">
                <span className="w-2 h-2 bg-neon-green rounded-full mr-2"></span>
                {totales.completadas} Completadas
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-neon-yellow/15 text-neon-yellow border border-neon-yellow/30">
                <span className="w-2 h-2 bg-neon-yellow rounded-full mr-2"></span>
                {totales.enProceso} En Proceso
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-neon-red/15 text-neon-red border border-neon-red/30">
                <span className="w-2 h-2 bg-neon-red rounded-full mr-2"></span>
                {totales.pendientes} Pendientes
            </span>
        </div>
    );
}