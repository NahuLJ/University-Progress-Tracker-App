import { EmptyState } from '../components/common/EmptyState';
import { QueryError } from '../components/common/QueryError';
import {
    MateriasAprobadasCard,
    PromedioCard,
    CreditosCard,
    MateriasDisponiblesCard,
    ProgresoBarCard,
} from '../components/dashboard/StatCards';
import {
    MateriasPorEstadoChart,
    NotasDistribucionChart,
    ProgresoPorAnioChart,
    EstadisticasSkeleton,
} from '../components/dashboard/Charts';
import { CreditosProgresoChart } from '../components/dashboard/CreditosProgresoChart';
import { CarrerasResumenList } from '../components/dashboard/CarrerasResumenList';
import { useEstadisticas } from '../hooks/useEstadisticas';
import { useCarrerasResumen } from '../hooks/useCarrerasResumen';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useCarreraStore } from '../store/carrera.store';

export function DashboardPage() {
    const usuarioCarreraId = useCarreraStore((s) => s.usuarioCarreraId);
    const setUsuarioCarreraId = useCarreraStore((s) => s.setUsuarioCarreraId);
    const {
        carreras,
        resumen,
        distribucion,
        notasDistribucion,
        progresoPorAnio,
        creditosProgreso,
        isLoading,
        error,
    } = useEstadisticas();
    const { data: resumenCarreras } = useCarrerasResumen();
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
        return (
            <EmptyState
                iconName="books"
                title="No tenés carreras registradas"
                description="Inscribite a una carrera para comenzar a seguir tu progreso."
                action={<Link to="/carreras" className="btn-primary">Ver carreras</Link>}
            />
        );
    }

    const carreraActiva = carreras?.find((c) => c.usuarioCarreraId === usuarioCarreraId);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Estadísticas académicas</h1>
                <p className="text-sm text-text-muted mt-1">
                    Resumen general de tu progreso académico, promedios y avance del plan.
                </p>
                {carreraActiva?.carrera?.nombre && (
                    <p className="label mt-2 text-accent-cyan">
                        {carreraActiva.carrera.nombre}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
                <MateriasAprobadasCard
                    aprobadas={resumen?.materiasCompletadas ?? 0}
                    total={resumen?.totalMaterias ?? 0}
                />
                <PromedioCard promedio={resumen?.promedioGeneral ?? null} />
                <CreditosCard
                    obtenidos={resumen?.creditosObtenidos ?? 0}
                    totales={resumen?.creditosTotales ?? 0}
                />
                <MateriasDisponiblesCard cantidad={resumen?.materiasDisponibles ?? 0} />
            </div>

            <ProgresoBarCard
                porcentaje={resumen?.progresoPorcentaje ?? 0}
                materiasRestantes={
                    (resumen?.totalMaterias ?? 0) - (resumen?.materiasCompletadas ?? 0)
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MateriasPorEstadoChart data={distribucion ?? []} />
                <NotasDistribucionChart data={notasDistribucion} />
            </div>

            <ProgresoPorAnioChart data={progresoPorAnio ?? []} />

            <CreditosProgresoChart data={creditosProgreso} />

            <div>
                <h2 className="text-sm font-semibold mb-3">Mis carreras</h2>
                <CarrerasResumenList
                    carreras={resumenCarreras ?? []}
                    usuarioCarreraIdActivo={usuarioCarreraId}
                    onSeleccionar={setUsuarioCarreraId}
                />
            </div>
        </div>
    );
}

export default DashboardPage;
