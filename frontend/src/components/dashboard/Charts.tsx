import { Card } from '../ui/Card';

type EstadoMateria = 'Completada' | 'En Proceso' | 'Pendiente';

const colores: Record<EstadoMateria, string> = {
    Completada: '#22c55e',
    'En Proceso': '#eab308',
    Pendiente: '#ef4444',
};

export function MateriasPorEstadoChart({ data }: { data: { estado: EstadoMateria; cantidad: number; porcentaje: number }[] }) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <div className="h-64 flex items-center justify-center text-gray-500">
                    Sin datos de distribución
                </div>
            </Card>
        );
    }

    const total = data.reduce((acc, d) => acc + d.cantidad, 0);
    const bgColores = {
        Completada: 'bg-green-500',
        'En Proceso': 'bg-yellow-500',
        Pendiente: 'bg-red-500',
    };

    return (
        <Card title="Distribución de materias">
            <div className="h-64 flex items-end justify-around px-4">
                {data.map((d) => (
                    <div key={d.estado} className="flex flex-col items-center">
                        <div
                            className={`${bgColores[d.estado] || 'bg-gray-400'} rounded-t w-16 transition-all hover:opacity-80`}
                            style={{ height: `${(d.cantidad / total) * 200}px` }}
                            title={`${d.estado}: ${d.cantidad} (${d.porcentaje}%)`}
                        />
                        <span className="text-xs mt-2">{d.estado}</span>
                        <span className="text-xs font-medium">{d.cantidad}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-center gap-4 mt-4 text-sm">
                {data.map((d) => (
                    <div key={d.estado} className="flex items-center gap-1">
                        <span
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: colores[d.estado] || '#999' }}
                        />
                        {d.estado}
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
                <div className="h-64 flex items-center justify-center text-gray-500">
                    Sin datos de evolución
                </div>
            </Card>
        );
    }

    const maxPromedio = Math.max(...data.map((d) => d.promedio), 10);
    const minPromedio = Math.min(...data.map((d) => d.promedio), 0);

    return (
        <Card title="Evolución del promedio">
            <div className="h-64 flex items-end justify-around px-4">
                {data.map((d, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div
                            className="bg-blue-500 rounded-t w-12 transition-all hover:opacity-80"
                            style={{ height: `${((d.promedio - minPromedio) / (maxPromedio - minPromedio)) * 200}px` }}
                            title={`${d.cuatrimestre}: ${d.promedio.toFixed(2)}`}
                        />
                        <span className="text-xs mt-2">{d.cuatrimestre}</span>
                        <span className="text-xs font-medium">{d.promedio.toFixed(2)}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

export function EstadisticasSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                            <div className="ml-4 space-y-2">
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <div className="h-64 bg-gray-100 rounded animate-pulse" />
                    </Card>
                ))}
            </div>
        </div>
    );
}