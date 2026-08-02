import { Card } from '../ui/Card';

type EstadoMateria = 'Completada' | 'En Proceso' | 'Pendiente';

const COLORES: Record<EstadoMateria, { hex: string; bar: string; dot: string }> = {
    Completada: { hex: '#10b981', bar: 'bg-status-success', dot: 'bg-status-success' },
    'En Proceso': { hex: '#f59e0b', bar: 'bg-status-warning', dot: 'bg-status-warning' },
    Pendiente: { hex: '#ef4444', bar: 'bg-status-danger', dot: 'bg-status-danger' },
};

export function MateriasPorEstadoChart({ data }: { data: { estado: EstadoMateria; cantidad: number; porcentaje: number }[] }) {
    if (!data || data.length === 0) {
        return (
            <Card title="Distribución de materias">
                <div className="h-64 flex items-center justify-center text-text-muted">
                    Sin datos de distribución
                </div>
            </Card>
        );
    }

    const maxCantidad = Math.max(...data.map((d) => d.cantidad), 1);

    return (
        <Card title="Distribución de materias">
            <div className="h-64 flex items-end justify-around px-4 pb-2">
                {data.map((d) => {
                    const config = COLORES[d.estado];
                    return (
                        <div key={d.estado} className="flex flex-col items-center justify-end h-full">
                            <span className="label mb-1">{d.cantidad}</span>
                            <div
                                className={`${config.bar} rounded-t w-16 transition-all duration-500 hover:opacity-80`}
                                style={{ height: `${(d.cantidad / maxCantidad) * 180}px` }}
                                title={`${d.estado}: ${d.cantidad} (${d.porcentaje}%)`}
                            />
                            <span className="label mt-2">{d.estado}</span>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-center gap-4 mt-4 text-sm">
                {data.map((d) => (
                    <div key={d.estado} className="flex items-center gap-1.5">
                        <span
                            className={`w-3 h-3 rounded-full ${COLORES[d.estado].dot}`}
                        />
                        <span className="text-text-muted">{d.estado}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

export function EvolucionPromedioChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return (
            <Card title="Evolución del promedio">
                <div className="h-64 flex items-center justify-center text-text-muted">
                    Sin datos de evolución
                </div>
            </Card>
        );
    }

    const maxPromedio = Math.max(...data.map((d) => d.promedio), 10);
    const minPromedio = Math.min(...data.map((d) => d.promedio), 0);

    return (
        <Card title="Evolución del promedio">
            <div className="h-64 flex items-end justify-around px-4 pb-2">
                {data.map((d, i) => (
                    <div key={i} className="flex flex-col items-center justify-end h-full">
                        <span className="label text-accent-cyan mb-1">{d.promedio.toFixed(2)}</span>
                        <div
                            className="bg-accent-cyan rounded-t w-12 transition-all duration-500 hover:opacity-80"
                            style={{ height: `${((d.promedio - minPromedio) / (maxPromedio - minPromedio || 1)) * 180}px` }}
                            title={`${d.cuatrimestre}: ${d.promedio.toFixed(2)}`}
                        />
                        <span className="label mt-2">{d.cuatrimestre}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-center mt-4 label">
                Eje Y: promedio (máx {maxPromedio.toFixed(2)} · mín {minPromedio.toFixed(2)})
            </div>
        </Card>
    );
}

export function EstadisticasSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-8 w-64 bg-bg-surface-secondary rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <div className="flex items-center">
                            <div className="h-10 w-10 bg-bg-surface-secondary rounded-md animate-pulse" />
                            <div className="ml-4 space-y-2">
                                <div className="h-4 w-24 bg-bg-surface-secondary rounded animate-pulse" />
                                <div className="h-6 w-16 bg-bg-surface-secondary rounded animate-pulse" />
                                <div className="h-3 w-20 bg-bg-surface-secondary rounded animate-pulse" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <div className="h-64 bg-bg-surface-secondary rounded animate-pulse" />
                    </Card>
                ))}
            </div>
        </div>
    );
}
