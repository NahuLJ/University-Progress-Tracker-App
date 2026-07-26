import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { QueryError } from '../components/common/QueryError';
import { useCarreraActiva } from '../hooks/useCarreras';
import { useArbolTrayectoria } from '../hooks/useTrayectoria';
import { planificacionService } from '../services/planificacion.service';
import { useNotificationStore } from '../store/notification.store';
import { ArbolTrayectoria } from '../components/planificacion/ArbolTrayectoria';
import { NuevoPeriodoModal } from '../components/planificacion/NuevoPeriodoModal';
import type { CrearPeriodoDto } from '../types/planificacion.types';

export function TrayectoriaPage() {
    const { id } = useParams<{ id: string }>();
    const trayectoriaId = id ? parseInt(id, 10) : null;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const addNotification = useNotificationStore((s) => s.addNotification);
    const { usuarioCarreraId, carreraActiva, isLoading: cargandoCarrera } = useCarreraActiva();
    const [mostrarNuevoPeriodo, setMostrarNuevoPeriodo] = useState(false);
    const [origenSeleccionado, setOrigenSeleccionado] = useState<number | undefined>(undefined);

    const { data: trayectoria, isLoading: trayectoriaLoading, error: trayectoriaError } = useQuery({
        queryKey: ['trayectoria', trayectoriaId],
        queryFn: () => {
            if (!trayectoriaId) return null;
            return planificacionService.listarPlanificacionesDeTrayectoria(trayectoriaId);
        },
        enabled: !!trayectoriaId,
    });

    const { data: arbol } = useArbolTrayectoria(trayectoriaId);

    const { data: trayectoriasList } = useQuery({
        queryKey: ['trayectorias', usuarioCarreraId],
        queryFn: () => {
            if (!usuarioCarreraId) return [];
            return planificacionService.listarTrayectorias(usuarioCarreraId);
        },
        enabled: !!usuarioCarreraId,
    });

    const trayectoriaNombre = trayectoriasList?.find((t) => t.trayectoriaId === trayectoriaId)?.nombre ?? 'Trayectoria';

    useEffect(() => {
        if (trayectoriasList && trayectoriaId && !trayectoriasList.some((t) => t.trayectoriaId === trayectoriaId)) {
            navigate('/trayectorias', { replace: true });
        }
    }, [trayectoriasList, trayectoriaId, navigate]);

    const planificaciones = trayectoria ?? [];
    const sortedPlanificaciones = [...planificaciones].sort((a, b) => {
        const orden: Record<string, number> = { Verano: 0, '1er Cuatrimestre': 1, '2do Cuatrimestre': 2 };
        if (a.anio !== b.anio) return a.anio - b.anio;
        return (orden[a.instancia] ?? 0) - (orden[b.instancia] ?? 0);
    });

    const handleContinuar = (origenId?: number) => {
        setOrigenSeleccionado(origenId);
        setMostrarNuevoPeriodo(true);
    };

    const handleCrearSucesivo = (data: { anio: number; instancia: string; nombre: string; trayectoriaId?: number; planificacionOrigenId?: number }) => {
        if (!usuarioCarreraId || !trayectoriaId) return;
        const payload: CrearPeriodoDto = {
            usuarioCarreraId,
            anio: data.anio,
            instancia: data.instancia as CrearPeriodoDto['instancia'],
            nombre: data.nombre,
            trayectoriaId,
            planificacionOrigenId: origenSeleccionado,
        };
        planificacionService.crearPeriodo(payload).then((nuevoPeriodo) => {
            queryClient.invalidateQueries({ queryKey: ['trayectoria', trayectoriaId] });
            queryClient.invalidateQueries({ queryKey: ['trayectoria-arbol', trayectoriaId] });
            queryClient.invalidateQueries({ queryKey: ['trayectorias', usuarioCarreraId] });
            queryClient.invalidateQueries({ queryKey: ['planificacion'] });
            addNotification('Planificación sucesiva creada', 'success');
            setMostrarNuevoPeriodo(false);
            setOrigenSeleccionado(undefined);
            navigate(`/planificacion/${nuevoPeriodo.periodoId}`);
        });
    };

    const periodosLoading = cargandoCarrera || trayectoriaLoading;

    if (periodosLoading) {
        return <TrayectoriaSkeleton />;
    }

    if (trayectoriaError) {
        return (
            <QueryError
                error={trayectoriaError}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['trayectoria', trayectoriaId] })}
            />
        );
    }

    if (!usuarioCarreraId) {
        return (
            <EmptyState
                iconName="calendar"
                title="No tenés carreras registradas"
                description="Inscribite a una carrera para gestionar trayectorias."
                action={<Button onClick={() => navigate('/carreras')}>Ver carreras</Button>}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate('/trayectorias')}
                        className="p-2 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                        title="Volver a trayectorias"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">{trayectoriaNombre}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M4 21V7a2 2 0 012-2h12a2 2 0 012 2v14" />
                                </svg>
                                <span className="text-sm font-medium text-white">{carreraActiva?.carrera?.nombre ?? ''}</span>
                            </div>
                            <span className="text-sm text-slate-400">&middot; {sortedPlanificaciones.length} planificaciones</span>
                        </div>
                    </div>
                </div>
                <Button variant="success" onClick={() => handleContinuar(undefined)}>
                    + Nueva planificación
                </Button>
            </div>

            {sortedPlanificaciones.length === 0 ? (
                <EmptyState
                    iconName="calendar"
                    title="Trayectoria vacía"
                    description="Agregá planificaciones para comenzar a planificar tus materias sucesivamente."
                    action={
                        <Button variant="success" onClick={() => handleContinuar(undefined)}>
                            Crear primera planificación
                        </Button>
                    }
                />
            ) : (
                <>
                    <Card>
                        <h2 className="text-lg font-semibold mb-4">Línea de tiempo</h2>
                        <div className="space-y-2">
                            {sortedPlanificaciones.map((p, idx) => (
                                <div key={p.periodoId} className="flex items-center gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${idx === sortedPlanificaciones.length - 1 ? 'bg-neon-cyan' : 'bg-slate-500'}`} />
                                        {idx < sortedPlanificaciones.length - 1 && <div className="w-0.5 h-8 bg-slate-600" />}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/planificacion/${p.periodoId}`)}
                                        className="flex-1 flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                                    >
                                        <div>
                                            <span className="text-white font-medium">
                                                {p.nombre || `${p.instancia} ${p.anio}`}
                                            </span>
                                            <span className="text-slate-400 text-sm ml-2">
                                                {p.materiasPlanificadas?.length ?? 0} materias
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleContinuar(p.periodoId);
                                                }}
                                            >
                                                Continuar
                                            </Button>
                                        </div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {arbol && arbol.periodo && (
                        <Card>
                            <h2 className="text-lg font-semibold mb-4">Árbol de bifurcaciones</h2>
                            <ArbolTrayectoria nodo={arbol} onNavigate={(pid) => navigate(`/planificacion/${pid}`)} onContinuar={handleContinuar} />
                        </Card>
                    )}
                </>
            )}

            <NuevoPeriodoModal
                isOpen={mostrarNuevoPeriodo}
                onClose={() => { setMostrarNuevoPeriodo(false); setOrigenSeleccionado(undefined); }}
                onSuccess={handleCrearSucesivo}
                trayectoriaId={trayectoriaId ?? undefined}
                planificacionOrigenId={origenSeleccionado}
            />
        </div>
    );
}

export default TrayectoriaPage;

function TrayectoriaSkeleton() {
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
                <Skeleton className="h-6 w-48 mb-4" />
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 mb-2">
                        <Skeleton className="w-3 h-3 rounded-full" />
                        <Skeleton className="h-12 flex-1 rounded-lg" />
                    </div>
                ))}
            </Card>
        </div>
    );
}
