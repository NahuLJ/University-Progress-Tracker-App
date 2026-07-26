import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { CalendarioSemanal } from '../components/planificacion/CalendarioSemanal';
import { usePlanificacion } from '../hooks/usePlanificacion';
import { usePlanificacionStore } from '../store/planificacion.store';
import { useCarreraActiva } from '../hooks/useCarreras';
import { EmptyState } from '../components/common/EmptyState';
import { QueryError } from '../components/common/QueryError';
import { MateriasDesbloqueablesList } from '../components/planificacion/Extras';
import { planificacionService } from '../services/planificacion.service';
import { useNotificationStore } from '../store/notification.store';
import { EditarPeriodoModal } from '../components/planificacion/EditarPeriodoModal';
import { NuevoPeriodoModal } from '../components/planificacion/NuevoPeriodoModal';

export function PlanificacionPage() {
    const { id } = useParams<{ id: string }>();
    const periodoId = id ? parseInt(id, 10) : null;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const addNotification = useNotificationStore((s) => s.addNotification);

    const { usuarioCarreraId, carreraActiva, isLoading: cargandoCarrera } = useCarreraActiva();
    const carreraId = carreraActiva?.carreraId ?? null;

    const {
        periodos,
        periodosLoading,
        periodosError,
        guardar,
        cargarPeriodo,
        materiasDesbloqueables,
        store,
    } = usePlanificacion(usuarioCarreraId, carreraId);

    const [mostrarDescarte, setMostrarDescarte] = useState(false);
    const [mostrarEditar, setMostrarEditar] = useState(false);
    const [mostrarDescartarCambios, setMostrarDescartarCambios] = useState(false);
    const [mostrarNuevoSucesivo, setMostrarNuevoSucesivo] = useState(false);

    const periodoActivo = store.periodoActivo;
    const periodoExiste = periodos?.some((p) => p.periodoId === periodoId);

    const { data: periodoFull } = useQuery({
        queryKey: ['planificacion', 'periodo-full', periodoId],
        queryFn: () => {
            if (!periodoId || !periodos) return null;
            return periodos.find((p) => p.periodoId === periodoId) ?? null;
        },
        enabled: !!periodoId && !!periodos,
    });

    const trayectoria = periodoFull?.trayectoria ?? null;

    useEffect(() => {
        if (!periodosLoading && periodos && periodoId && !isNaN(periodoId) && periodoExiste) {
            cargarPeriodo(periodoId);
        }
    }, [periodosLoading, periodos, periodoId, cargarPeriodo, periodoExiste]);

    useEffect(() => {
        return () => {
            usePlanificacionStore.getState().limpiarStore();
        };
    }, []);

    const handleEditar = () => {
        if (periodoActivo) {
            setMostrarEditar(true);
        }
    };

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
        return (
            <EmptyState
                iconName="calendar"
                title="No tenés carreras registradas"
                description="Inscribite a una carrera para planificar tus horarios."
                action={
                    <Button onClick={() => navigate('/carreras')}>
                        Ver carreras
                    </Button>
                }
            />
        );
    }

    if (!periodoId || isNaN(periodoId) || (periodos && !periodoExiste)) {
        return (
            <EmptyState
                iconName="calendar"
                title="Planificación no encontrada"
                description="La planificación que buscás no existe o fue eliminada."
                action={
                    <Button onClick={() => navigate(-1)}>
                        Volver
                    </Button>
                }
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                        title="Volver"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        {trayectoria && (
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                                <button
                                    type="button"
                                    onClick={() => navigate('/trayectorias')}
                                    className="hover:text-neon-cyan transition-colors"
                                >
                                    Trayectorias
                                </button>
                                <span>/</span>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/trayectoria/${trayectoria.trayectoriaId}`)}
                                    className="hover:text-neon-cyan transition-colors"
                                >
                                    {trayectoria.nombre}
                                </button>
                            </div>
                        )}
                        <h1 className="text-2xl font-bold">
                            {periodoActivo?.anio} {periodoActivo?.instancia}
                            {periodoActivo?.nombre && ` - ${periodoActivo.nombre}`}
                        </h1>
                        <div className="flex items-center gap-1.5 mt-1">
                            <svg className="w-4 h-4 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M4 21V7a2 2 0 012-2h12a2 2 0 012 2v14" />
                            </svg>
                            <span className="text-sm font-medium text-white">{carreraActiva?.carrera?.nombre ?? ''}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {trayectoria && (
                        <Button
                            variant="outline"
                            onClick={() => setMostrarNuevoSucesivo(true)}
                            className="text-sm"
                        >
                            + Continuar
                        </Button>
                    )}
                    <Button
                        variant="warning"
                        onClick={handleEditar}
                        className="text-sm"
                    >
                        Editar período
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => setMostrarDescarte(true)}
                        className="text-sm"
                    >
                        Eliminar período
                    </Button>
                </div>
            </div>

            {trayectoria && (
                <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-3 text-sm text-neon-cyan">
                    Esta planificación pertenece a la trayectoria <strong>{trayectoria.nombre}</strong>.
                    Las materias disponibles incluyen las que se desbloquean según planificaciones anteriores de esta trayectoria.
                </div>
            )}

            <Card>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Planificación de horarios</h2>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setMostrarDescartarCambios(true)}
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
                            Tenés cambios sin guardar
                        </p>
                    </div>
                </div>
            </Card>

            <CalendarioSemanal />

            {materiasDesbloqueables.length > 0 && (
                <MateriasDesbloqueablesList materias={materiasDesbloqueables} />
            )}

            <Modal
                isOpen={mostrarDescarte}
                onClose={() => setMostrarDescarte(false)}
                title="Eliminar período"
                size="sm"
            >
                <p className="text-slate-300 mb-6">¿Eliminar esta planificación? Los cambios realizados se perderán.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setMostrarDescarte(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => {
                            if (!periodoId) return;
                            setMostrarDescarte(false);
                            usePlanificacionStore.getState().setPeriodoActivo(null);
                            planificacionService.eliminarPeriodo(periodoId).then(() => {
                                queryClient.invalidateQueries({ queryKey: ['trayectoria'] });
                                queryClient.invalidateQueries({ queryKey: ['trayectorias'] });
                                queryClient.invalidateQueries({ queryKey: ['planificacion'] });
                                addNotification('Período eliminado', 'success');
                                navigate(-1);
                            });
                        }}
                    >
                        Eliminar
                    </Button>
                </div>
            </Modal>

            <Modal
                isOpen={mostrarDescartarCambios}
                onClose={() => setMostrarDescartarCambios(false)}
                title="Descartar cambios"
                size="sm"
            >
                <p className="text-slate-300 mb-6">¿Descartar cambios sin guardar? Los cambios realizados se perderán.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setMostrarDescartarCambios(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => {
                            setMostrarDescartarCambios(false);
                            store.resetCeldas();
                            if (periodoId) cargarPeriodo(periodoId);
                        }}
                    >
                        Descartar
                    </Button>
                </div>
            </Modal>

            <EditarPeriodoModal
                isOpen={mostrarEditar}
                onClose={() => setMostrarEditar(false)}
                onSuccess={(data) => {
                    if (!periodoId) return;
                    planificacionService.actualizarPeriodo(periodoId, data).then(() => {
                        queryClient.invalidateQueries({ queryKey: ['planificacion'] });
                        addNotification('Período actualizado', 'success');
                        setMostrarEditar(false);
                        if (periodoActivo?.periodoId) {
                            cargarPeriodo(periodoActivo.periodoId);
                        }
                    });
                }}
                initialData={periodoActivo ? {
                    anio: periodoActivo.anio,
                    instancia: periodoActivo.instancia as 'Verano' | '1er Cuatrimestre' | '2do Cuatrimestre',
                    nombre: periodoActivo.nombre ?? '',
                } : null}
            />

            <NuevoPeriodoModal
                isOpen={mostrarNuevoSucesivo}
                onClose={() => setMostrarNuevoSucesivo(false)}
                onSuccess={(data) => {
                    if (!usuarioCarreraId || !trayectoria || !periodoId) return;
                    planificacionService.crearPeriodo({
                        ...data,
                        usuarioCarreraId,
                        trayectoriaId: trayectoria.trayectoriaId,
                        planificacionOrigenId: periodoId,
                    }).then((nuevoPeriodo) => {
                        queryClient.invalidateQueries({ queryKey: ['planificacion'] });
                        queryClient.invalidateQueries({ queryKey: ['trayectoria'] });
                        queryClient.invalidateQueries({ queryKey: ['trayectorias'] });
                        addNotification('Planificación sucesiva creada', 'success');
                        setMostrarNuevoSucesivo(false);
                        navigate(`/planificacion/${nuevoPeriodo.periodoId}`);
                    });
                }}
                trayectoriaId={trayectoria?.trayectoriaId}
                planificacionOrigenId={periodoId ?? undefined}
            />
        </div>
    );
}

export default PlanificacionPage;

function PlanificacionSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48 mt-1" />
                </div>
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
