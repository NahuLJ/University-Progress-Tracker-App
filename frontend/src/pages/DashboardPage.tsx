import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { QueryError } from '../components/common/QueryError';
import {
    PromedioCard,
    TiempoRestanteCard,
    CreditosCard,
    ProgresoBarCard,
} from '../components/dashboard/StatCards';
import {
    MateriasPorEstadoChart,
    EvolucionPromedioChart,
} from '../components/dashboard/Charts';
import { CarrerasResumenList } from '../components/dashboard/CarrerasResumenList';
import { useDashboard } from '../hooks/useDashboard';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

export function DashboardPage() {
    const {
        carreras, usuarioCarreraId, setUsuarioCarreraId,
        resumen, distribucion, evolucion, isLoading, error,
    } = useDashboard();
    const queryClient = useQueryClient();

    if (isLoading) return <EstadisticasSkeleton />;

    if (error) {
        return (
            <QueryError
                error={error}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['estadisticas'] })}
            />
        );
    }

    if (carreras?.length === 0) {
        return <EmptyState
                iconName="books"
            title="No tenés carreras registradas"
            description="Inscribite a una carrera para comenzar a seguir tu progreso."
            action={<Link to="/carreras" className="btn-primary">Ver carreras</Link>}
        />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                {carreras && carreras.length > 1 && (
                    <select
                        value={usuarioCarreraId ?? ''}
                        onChange={(e) => setUsuarioCarreraId(Number(e.target.value))}
                        className="border rounded-lg p-2"
                    >
                        {carreras.map((c) => (
                            <option key={c.usuarioCarreraId} value={c.usuarioCarreraId}>
                                {c.carrera.nombre}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <PromedioCard
                    promedio={resumen?.promedioGeneral ?? null}
                    materiasConNota={resumen?.materiasCompletadas ?? 0}
                />
                <TiempoRestanteCard cuatrimestres={resumen?.cuatrimestresRestantes ?? null} />
                <CreditosCard
                    obtenidos={resumen?.creditosObtenidos ?? 0}
                    totales={resumen?.creditosTotales ?? 0}
                />
                <ProgresoBarCard porcentaje={resumen?.progresoPorcentaje ?? 0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MateriasPorEstadoChart data={distribucion ?? []} />
                <EvolucionPromedioChart data={evolucion ?? []} />
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-3">Mis carreras</h2>
                <CarrerasResumenList carreras={carreras ?? []} />
            </div>
        </div>
    );
}

export default DashboardPage;

function EstadisticasSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <div className="flex items-center">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="ml-4 space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <Skeleton className="h-64 w-full" />
                    </Card>
                ))}
            </div>
        </div>
    );
}
