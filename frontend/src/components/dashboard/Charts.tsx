import { Card } from '../ui/Card';

type EstadoMateria = 'Completada' | 'En Proceso' | 'Pendiente';

const COLORES: Record<EstadoMateria, { hex: string; bar: string; dot: string }> = {
    Completada: { hex: '#34d399', bar: 'bg-neon-green shadow-neon-green', dot: 'bg-neon-green shadow-neon-green' },
    'En Proceso': { hex: '#facc15', bar: 'bg-neon-yellow shadow-neon-yellow', dot: 'bg-neon-yellow shadow-neon-yellow' },
    Pendiente: { hex: '#f87171', bar: 'bg-neon-red shadow-neon-red', dot: 'bg-neon-red shadow-neon-red' },
};

export function MateriasPorEstadoChart({ data }: { data: { estado: EstadoMateria; cantidad: number; porcentaje: number }[] }) {
    if (!data || data.length === 0) {
        return (
            <Card title="Distribución de materias">
                <div className="h-64 flex items-center justify-center text-slate-400">
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
                            <span className="text-xs font-semibold text-slate-300 mb-1">{d.cantidad}</span>
                            <div
                                className={`${config.bar} rounded-t w-16 transition-all duration-500 hover:opacity-80`}
                                style={{ height: `${(d.cantidad / maxCantidad) * 180}px` }}
                                title={`${d.estado}: ${d.cantidad} (${d.porcentaje}%)`}
                            />
                            <span className="text-xs text-slate-400 mt-2">{d.estado}</span>
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
                        <span className="text-slate-300">{d.estado}</span>
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
                <div className="h-64 flex items-center justify-center text-slate-400">
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
                        <span className="text-xs font-semibold text-neon-cyan mb-1">{d.promedio.toFixed(2)}</span>
                        <div
                            className="bg-neon-cyan shadow-neon-cyan rounded-t w-12 transition-all duration-500 hover:opacity-80"
                            style={{ height: `${((d.promedio - minPromedio) / (maxPromedio - minPromedio || 1)) * 180}px` }}
                            title={`${d.cuatrimestre}: ${d.promedio.toFixed(2)}`}
                        />
                        <span className="text-xs text-slate-400 mt-2">{d.cuatrimestre}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-center mt-4 text-xs text-slate-500">
                Eje Y: promedio (máx {maxPromedio.toFixed(2)} · mín {minPromedio.toFixed(2)})
            </div>
        </Card>
    );
}

export function EstadisticasSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-8 w-64 bg-base-600/70 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <div className="flex items-center">
                            <div className="h-10 w-10 bg-base-600/70 rounded-lg animate-pulse" />
                            <div className="ml-4 space-y-2">
                                <div className="h-4 w-24 bg-base-600/70 rounded animate-pulse" />
                                <div className="h-6 w-16 bg-base-600/70 rounded animate-pulse" />
                                <div className="h-3 w-20 bg-base-600/70 rounded animate-pulse" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <div className="h-64 bg-base-600/50 rounded animate-pulse" />
                    </Card>
                ))}
            </div>
        </div>
    );
}
