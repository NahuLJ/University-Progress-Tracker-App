import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
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
import { MateriasDesbloqueablesList } from '../components/planificacion/Extras';

export function PlanificacionPage() {
    const { usuarioCarreraId, carreraActiva, isLoading: cargandoCarrera } = useCarreraActiva();
    const carreraId = carreraActiva?.carreraId ?? null;
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
    } = usePlanificacion(usuarioCarreraId, carreraId);

    const [mostrarNuevoPeriodo, setMostrarNuevoPeriodo] = useState(false);
    const [mostrarDescarte, setMostrarDescarte] = useState(false);

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

    const periodoActivo = store.periodoActivo;
    const periodoId = periodoActivo?.periodoId;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Planificación de Horarios</h1>
                <Button onClick={() => setMostrarNuevoPeriodo(true)}>+ Nueva planificación</Button>
            </div>

            {!periodos || periodos.length === 0 ? (
                <EmptyState
                    iconName="calendar"
                    title="No hay planificaciones"
                    description="Creá una planificación para comenzar a organizar tus horarios de clase."
                />
            ) : (
                <>
                    <PlanificacionTabs
                        periodos={periodos}
                        periodoActivo={periodoActivo}
                        onSelect={cargarPeriodo}
                    />

                    {!periodoActivo && (
                        <EmptyState
                            iconName="calendar"
                            title="Seleccioná una planificación"
                            description="Elegí un período de planificación de los tabs de arriba para comenzar a organizar tus horarios."
                        />
                    )}

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
                                                onClick={() => setMostrarDescarte(true)}
                                                disabled={!store.dirty}
                                            >
                                                Descartar cambios
                                            </Button>
                                            <Button
                                                onClick={() => periodoId && guardar.mutate(periodoId)}
                                                loading={guardar.isPending}
                                                disabled={!store.dirty}
                                            >
                                                Guardar planificación
                                            </Button>
                                        </div>
                                    </div>

                                    <div className={`bg-neon-yellow/10 border border-neon-yellow/40 rounded-lg p-3 transition-opacity ${store.dirty ? 'opacity-100' : 'opacity-0'}`}>
                                        <p className="text-sm text-neon-yellow">
                                            ✅ Tenés cambios sin guardar
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <CalendarioSemanal />

                            {materiasDesbloqueables.length > 0 && (
                                <MateriasDesbloqueablesList materias={materiasDesbloqueables} />
                            )}
                        </>
                    )}
                </>
            )}

            <Modal
                isOpen={mostrarDescarte}
                onClose={() => setMostrarDescarte(false)}
                title="Descartar cambios"
                size="sm"
            >
                <p className="text-slate-300 mb-6">¿Descartar cambios sin guardar? Los cambios realizados se perderán.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setMostrarDescarte(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => {
                            setMostrarDescarte(false);
                            store.resetCeldas();
                            if (periodoId) cargarPeriodo(periodoId);
                        }}
                    >
                        Descartar
                    </Button>
                </div>
            </Modal>

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