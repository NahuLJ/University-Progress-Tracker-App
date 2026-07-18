import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { CalendarioSemanal } from '../components/planificacion/CalendarioSemanal';
import { NuevoPeriodoModal } from '../components/planificacion/NuevoPeriodoModal';
import { PlanificacionTabs } from '../components/planificacion/PlanificacionTabs';
import { usePlanificacion } from '../hooks/usePlanificacion';
import { useCarreraActiva } from '../hooks/useCarreras';
import { EmptyState } from '../components/common/EmptyState';
import { QueryError } from '../components/common/QueryError';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { MateriasDesbloqueablesList, LeyendaHorarios } from '../components/planificacion/Extras';

export function PlanificacionPage() {
    const { usuarioCarreraId, isLoading: cargandoCarrera } = useCarreraActiva();
    const queryClient = useQueryClient();

    const {
        periodos,
        periodosLoading,
        periodosError,
        crearPeriodo,
        guardar,
        cargarPeriodo,
        materiasDesbloqueables,
        store,
    } = usePlanificacion(usuarioCarreraId);

    const [mostrarNuevoPeriodo, setMostrarNuevoPeriodo] = useState(false);

    if (cargandoCarrera || periodosLoading) {
        return <PlanificacionSkeleton />;
    }

    if (periodosError) {
        return (
            <QueryError
                error={periodosError}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['planificacion'] })}
            />
        );
    }

    if (!usuarioCarreraId) {
        return <EmptyState
            iconName="calendar"
            title="No tenés carreras registradas"
            description="Inscribite a una carrera para planificar tus horarios."
            action={<Link to="/carreras" className="btn-primary">Ver carreras</Link>}
        />;
    }

    if (!periodos || periodos.length === 0) {
        return <EmptyState
            iconName="calendar"
            title="No hay planificaciones"
            description="Creá una planificación para comenzar a organizar tus horarios de clase."
            action={<Button onClick={() => setMostrarNuevoPeriodo(true)}>Crear planificación</Button>}
        />;
    }

    const periodoActivo = store.periodoActivo;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Planificación de Horarios</h1>
                <Button onClick={() => setMostrarNuevoPeriodo(true)}>+ Nueva planificación</Button>
            </div>

            <PlanificacionTabs
                periodos={periodos}
                periodoActivo={periodoActivo}
                onSelect={cargarPeriodo}
                onNuevo={() => setMostrarNuevoPeriodo(true)}
            />

            {periodoActivo && (
                <>
                    <Card>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold">
                                    {periodoActivo.anio} {periodoActivo.instancia}
                                    {periodoActivo.nombre && ` - ${periodoActivo.nombre}`}
                                </h2>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            if (confirm('¿Descartar cambios sin guardar?')) {
                                                store.limpiarStore();
                                                cargarPeriodo(periodoActivo.periodoId!);
                                            }
                                        }}
                                        disabled={!store.dirty}
                                    >
                                        Descartar cambios
                                    </Button>
                                    <Button
                                        onClick={() => guardar.mutate(periodoActivo.periodoId!)}
                                        loading={guardar.isPending}
                                        disabled={!store.dirty}
                                    >
                                        Guardar planificación
                                    </Button>
                                </div>
                            </div>

                            {store.dirty && (
                                <div className="bg-neon-yellow/10 border border-neon-yellow/40 rounded-lg p-3">
                                    <p className="text-sm text-neon-yellow">
                                        ✅ Tenés cambios sin guardar
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <CalendarioSemanal />

                    {materiasDesbloqueables.length > 0 && (
                        <MateriasDesbloqueablesList materias={materiasDesbloqueables} />
                    )}

                    <LeyendaHorarios materias={Object.values(store.celdas).flat()} />
                </>
            )}

            <NuevoPeriodoModal
                isOpen={mostrarNuevoPeriodo}
                onClose={() => setMostrarNuevoPeriodo(false)}
                onSuccess={(data) => {
                    setMostrarNuevoPeriodo(false);
                    crearPeriodo.mutate({
                        usuarioCarreraId,
                        anio: data.anio,
                        instancia: data.instancia,
                        nombre: data.nombre,
                    });
                }}
            />
        </div>
    );
}

export default PlanificacionPage;

function PlanificacionSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <Card>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-48" />
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-36" />
                        </div>
                    </div>
                </div>
            </Card>
            <Card>
                <Skeleton className="h-96 w-full" />
            </Card>
        </div>
    );
}