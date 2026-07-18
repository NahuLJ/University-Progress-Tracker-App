import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { QueryError } from '../components/common/QueryError';
import { Link } from 'react-router-dom';
import { ProgresoGrid, FiltroEstado, FiltroBusqueda, ProgresoStatsBar, CarrerasResumenList } from '../components/progreso';
import { useProgreso } from '../hooks/useProgreso';
import { useCarreraActiva } from '../hooks/useCarreras';
import { useCarrerasResumen } from '../hooks/useCarrerasResumen';
import { useQueryClient } from '@tanstack/react-query';

export function ProgresoPage() {
    const { carreraActiva, usuarioCarreraId, isLoading: cargandoCarrera } = useCarreraActiva();
    const { data: resumenCarreras } = useCarrerasResumen();
    const [carreraSeleccionada, setCarreraSeleccionada] = useState<number | null>(null);
    const queryClient = useQueryClient();

    const idActivo = carreraSeleccionada ?? usuarioCarreraId;

    const {
        progresos,
        totales,
        filtroEstado,
        setFiltroEstado,
        busqueda,
        setBusqueda,
        actualizar,
        isLoading,
        error,
    } = useProgreso(idActivo);

    if (cargandoCarrera || (idActivo && isLoading)) {
        return <ProgresoSkeleton />;
    }

    if (error) {
        return (
            <QueryError
                error={error}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['progreso', idActivo] })}
            />
        );
    }

    if (!usuarioCarreraId) {
        return <EmptyState
                iconName="books"
            title="No tenés carreras registradas"
            description="Inscribite a una carrera para registrar tu progreso académico."
            action={<Link to="/carreras" className="btn-primary">Ver carreras</Link>}
        />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Progreso Académico</h1>
                <span className="text-sm text-slate-400">
                    {carreraActiva?.carrera.nombre}
                    {carreraActiva?.activo ? ' (Activa)' : ''}
                </span>
            </div>

            {resumenCarreras && resumenCarreras.length > 1 && (
                <CarrerasResumenList
                    carreras={resumenCarreras}
                    usuarioCarreraIdActivo={idActivo}
                    onSeleccionar={setCarreraSeleccionada}
                />
            )}

            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-lg font-semibold">Distribución de Estados</h2>
                    <ProgresoStatsBar totales={totales} />
                </div>
            </Card>

            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <FiltroEstado filtroEstado={filtroEstado} setFiltroEstado={setFiltroEstado} />
                <FiltroBusqueda busqueda={busqueda} setBusqueda={setBusqueda} />
            </div>

            <ProgresoGrid
                progresos={progresos}
                onSave={actualizar}
                isSaving={isLoading}
            />
        </div>
    );
}

export default ProgresoPage;

function ProgresoSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Skeleton className="h-6 w-48" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                </div>
            </Card>
            <div className="flex flex-col sm:flex-row gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
            </div>
            <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                    <Card key={i}>
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}