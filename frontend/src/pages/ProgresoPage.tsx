import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { QueryError } from '../components/common/QueryError';
import { Link } from 'react-router-dom';
import { FiltroEstado, FiltroBusqueda, ProgresoStatsBar, CarrerasResumenList } from '../components/progreso';
import { ProgresoTree } from '../components/progreso/ProgresoTree';
import { useProgreso } from '../hooks/useProgreso';
import { useCarreraActiva } from '../hooks/useCarreras';
import { useCarrerasResumen } from '../hooks/useCarrerasResumen';
import { useCarreraStore } from '../store/carrera.store';
import { useQueryClient } from '@tanstack/react-query';
import { Card as CardUI } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';

export function ProgresoPage() {
    const setUsuarioCarreraId = useCarreraStore((s) => s.setUsuarioCarreraId);
    const { usuarioCarreraId, isLoading: cargandoCarrera, carreraActiva } = useCarreraActiva();
    const { data: resumenCarreras } = useCarrerasResumen();
    const queryClient = useQueryClient();

    const {
        progresos,
        totales,
        filtroEstado,
        setFiltroEstado,
        busqueda,
        setBusqueda,
        actualizar,
        isLoading,
        isSaving,
        error,
    } = useProgreso(usuarioCarreraId);

    if (cargandoCarrera || (usuarioCarreraId && isLoading)) {
        return <ProgresoSkeleton />;
    }

    if (error) {
        return (
            <QueryError
                error={error}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['progreso', usuarioCarreraId] })}
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

    const carreraInactiva = carreraActiva && !carreraActiva.activo;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Progreso Académico</h1>

            {resumenCarreras && resumenCarreras.length > 1 && (
                <CarrerasResumenList
                    carreras={resumenCarreras}
                    usuarioCarreraIdActivo={usuarioCarreraId}
                    onSeleccionar={setUsuarioCarreraId}
                />
            )}

            {carreraInactiva ? (
                <CardUI className="border-neon-red/30 bg-neon-red/5">
                    <div className="flex items-center gap-3 p-4">
                        <div className="w-10 h-10 rounded-full bg-neon-red/20 flex items-center justify-center flex-shrink-0">
                            <Icon name="warning" className="w-5 h-5 text-neon-red" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-neon-red">Carrera inactiva</h3>
                            <p className="text-slate-300 mt-1">
                                No se pueden realizar modificaciones en el progreso de carreras inactivas.
                                Reactivá la carrera desde la sección de Carreras para volver a editar tu progreso.
                            </p>
                        </div>
                    </div>
                </CardUI>
            ) : (
                <>
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

                    <ProgresoTree
                        progresos={progresos}
                        onSave={actualizar}
                        isSaving={isSaving}
                        carreraId={carreraActiva?.carrera?.carreraId}
                    />
                </>
            )}
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
                <Skeleton className="h-10 w-48" />
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