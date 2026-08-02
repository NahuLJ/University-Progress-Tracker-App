export { ProgresoGrid } from './ProgresoGrid';
export { FiltroEstado, FiltroBusqueda } from './Filtros';
export { CarrerasResumenList } from './CarrerasResumenList';

export function ProgresoStatsBar({ totales }: { totales: { completadas: number; enProceso: number; pendientes: number } }) {
    return (
        <div className="flex flex-wrap gap-3">
            <span className="badge badge-success gap-1.5">
                <span className="w-2 h-2 bg-status-success rounded-full"></span>
                {totales.completadas} Completadas
            </span>
            <span className="badge badge-warning gap-1.5">
                <span className="w-2 h-2 bg-status-warning rounded-full"></span>
                {totales.enProceso} En Proceso
            </span>
            <span className="badge badge-danger gap-1.5">
                <span className="w-2 h-2 bg-status-danger rounded-full"></span>
                {totales.pendientes} Pendientes
            </span>
        </div>
    );
}
