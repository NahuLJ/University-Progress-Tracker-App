import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { CalendarioSemanal } from '../components/planificacion/CalendarioSemanal';
import { ConfirmarEliminacionModal } from '../components/planificacion/ConfirmarEliminacionModal';
import { usePlanificacion } from '../hooks/usePlanificacion';
import { usePlanificacionStore } from '../store/planificacion.store';
import { useCarreraActiva } from '../hooks/useCarreras';
import { useProgreso } from '../hooks/useProgreso';
import { EmptyState } from '../components/common/EmptyState';
import { QueryError } from '../components/common/QueryError';
import { MateriasDesbloqueablesList } from '../components/planificacion/Extras';
import { planificacionService } from '../services/planificacion.service';
import { useNotificationStore } from '../store/notification.store';
import { EditarPeriodoModal } from '../components/planificacion/EditarPeriodoModal';
import { NuevoPeriodoModal } from '../components/planificacion/NuevoPeriodoModal';
import type { MateriaEnCelda, MateriaImpactada } from '../types/planificacion.types';

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
    const [impactoState, setImpactoState] = useState<{
        materia: MateriaEnCelda;
        bloqueId: number;
        dia: string;
        impactadas: MateriaImpactada[];
    } | null>(null);

    const { progresos } = useProgreso(usuarioCarreraId);
    const idsCompletadas = useMemo(() => {
        if (!progresos) return new Set<number>();
        return new Set(
            progresos
                .filter((p) => p.estado.nombre === 'Completada')
                .map((p) => p.materia.materiaId),
        );
    }, [progresos]);

    const periodoActivo = store.periodoActivo;
    const periodoExiste = periodos?.some((p) => p.periodoId === periodoId);

    const periodoFull = useMemo(() => {
        if (!periodoId || !periodos) return null;
        return periodos.find((p) => p.periodoId === periodoId) ?? null;
    }, [periodoId, periodos]);

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

    const handleBeforeQuitar = useCallback(async (materia: MateriaEnCelda, bloqueId: number, dia: string) => {
        if (idsCompletadas.has(materia.materiaId)) {
            addNotification('No se puede eliminar una materia completada', 'error');
            return;
        }

        const celdas = usePlanificacionStore.getState().celdas;
        const bloquesMateria = Object.values(celdas).filter(m => m?.materiaId === materia.materiaId).length;

        if (bloquesMateria > 1) {
            usePlanificacionStore.getState().quitarMateria(bloqueId, dia);
            return;
        }

        if (materia.planificacionId === 0) {
            usePlanificacionStore.getState().quitarMateria(bloqueId, dia);
            return;
        }

        try {
            const impactadas = await planificacionService.obtenerImpactoEliminacion(materia.planificacionId);
            if (impactadas.length === 0) {
                usePlanificacionStore.getState().quitarMateria(bloqueId, dia);
            } else {
                setImpactoState({ materia, bloqueId, dia, impactadas });
            }
        } catch {
            usePlanificacionStore.getState().quitarMateria(bloqueId, dia);
        }
    }, [idsCompletadas, addNotification]);

    const handleImpactoCascade = useCallback(async () => {
        if (!impactoState || !periodoId) return;
        const { materia } = impactoState;
        try {
            await planificacionService.eliminarMateriaPlanificada(materia.planificacionId, 'cascade');

            const state = usePlanificacionStore.getState();
            const keysAEliminar = Object.entries(state.celdas)
                .filter(([, m]) => m?.materiaId === materia.materiaId)
                .map(([k]) => k);
            const newCeldas = { ...state.celdas };
            for (const k of keysAEliminar) {
                delete newCeldas[k];
            }
            const nuevasDisponibles = [...state.materiasDisponibles];
            if (!nuevasDisponibles.some(m => m.materiaId === materia.materiaId)) {
                nuevasDisponibles.push(materia);
            }
            usePlanificacionStore.setState({ celdas: newCeldas, materiasDisponibles: nuevasDisponibles });

            addNotification('Materia eliminada en cascada', 'success');
            queryClient.invalidateQueries({ queryKey: ['trayectoria'] });
            queryClient.invalidateQueries({ queryKey: ['trayectoria-arbol'] });
            queryClient.invalidateQueries({ queryKey: ['planificacion'] });
        } catch {
            addNotification('Error al eliminar en cascada', 'error');
        }
        setImpactoState(null);
    }, [impactoState, addNotification, queryClient, periodoId]);

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

            <CalendarioSemanal
                onBeforeQuitar={handleBeforeQuitar}
                idsCompletadas={idsCompletadas}
            />

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
                                queryClient.invalidateQueries({ queryKey: ['trayectoria-arbol'] });
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
                readonlyAnioInstancia={!!trayectoria}
                onSuccess={(data) => {
                    if (!periodoId) return;
                    planificacionService.actualizarPeriodo(periodoId, data).then(() => {
                        queryClient.invalidateQueries({ queryKey: ['planificacion'] });
                        queryClient.invalidateQueries({ queryKey: ['trayectoria'] });
                        queryClient.invalidateQueries({ queryKey: ['trayectoria-arbol'] });
                        queryClient.invalidateQueries({ queryKey: ['trayectorias'] });
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
                origenAnio={periodoFull?.anio}
                origenInstancia={periodoFull?.instancia as 'Verano' | '1er Cuatrimestre' | '2do Cuatrimestre' | undefined}
            />

            <ConfirmarEliminacionModal
                isOpen={impactoState !== null}
                onClose={() => setImpactoState(null)}
                materiaNombre={impactoState?.materia.nombre ?? ''}
                materiaCodigo={impactoState?.materia.codigo ?? ''}
                periodoActualNombre={periodoActivo ? `${periodoActivo.anio} ${periodoActivo.instancia}${periodoActivo.nombre ? ` - ${periodoActivo.nombre}` : ''}` : ''}
                impactadas={impactoState?.impactadas ?? []}
                onCascade={handleImpactoCascade}
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
