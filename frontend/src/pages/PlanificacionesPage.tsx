import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { QueryError } from '../components/common/QueryError';
import { NuevoPeriodoModal } from '../components/planificacion/NuevoPeriodoModal';
import { PlanificacionCard } from '../components/planificacion/PlanificacionCard';
import { Icon } from '../components/ui/Icon';
import { useCarreraActiva } from '../hooks/useCarreras';
import { planificacionService } from '../services/planificacion.service';
import { useNotificationStore } from '../store/notification.store';
import type { CrearPeriodoDto } from '../types/planificacion.types';

export function PlanificacionesPage() {
    const { usuarioCarreraId, carreraActiva, isLoading: cargandoCarrera } = useCarreraActiva();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const addNotification = useNotificationStore((s) => s.addNotification);
    const [mostrarNuevoPeriodo, setMostrarNuevoPeriodo] = useState(false);

    const periodosQuery = useInfiniteQuery({
        queryKey: ['planificacion', 'periodos-paginado', usuarioCarreraId],
        queryFn: ({ pageParam }) => planificacionService.listarPeriodosPaginado(usuarioCarreraId!, pageParam, 12, true),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (lastPage.page < lastPage.totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        enabled: !!usuarioCarreraId,
    });

    const periodos = periodosQuery.data?.pages.flatMap(p => p.data) ?? [];
    const total = periodosQuery.data?.pages[0]?.total ?? 0;
    const isLoading = cargandoCarrera || periodosQuery.isLoading;
    const error = periodosQuery.error;

    const crearPeriodo = useMutation({
        mutationFn: (data: CrearPeriodoDto) => planificacionService.crearPeriodo(data),
        onSuccess: (nuevoPeriodo) => {
            queryClient.invalidateQueries({ queryKey: ['planificacion', 'periodos-paginado', usuarioCarreraId] });
            queryClient.invalidateQueries({ queryKey: ['planificacion', 'periodos', usuarioCarreraId] });
            addNotification('Planificación creada', 'success');
            navigate(`/planificacion/${nuevoPeriodo.periodoId}`);
        },
        onError: () => {
            addNotification('Error al crear la planificación', 'error');
        },
    });

    if (isLoading) {
        return <PlanificacionesSkeleton />;
    }

    if (error) {
        return (
            <QueryError
                error={error}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['planificacion', 'periodos-paginado', usuarioCarreraId] })}
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">Planificaciones</h1>
                        {total > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30">
                                {total}
                            </span>
                        )}
                    </div>
                    {carreraActiva?.carrera?.nombre && (
                        <div className="flex items-center gap-1.5 mt-1">
                            <svg className="w-4 h-4 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-sm font-medium text-white">{carreraActiva.carrera.nombre}</span>
                        </div>
                    )}
                    <p className="text-sm text-slate-400 mt-1">
                        Planificaciones independientes para organizar horarios período por período.
                        Si querés planificar varios cuatrimestres consecutivos con materias que se desbloquean entre sí, usá{' '}
                        <button type="button" onClick={() => navigate('/trayectorias')} className="text-neon-cyan hover:underline">
                            Trayectorias
                        </button>.
                    </p>
                </div>
                <Button variant="success" onClick={() => setMostrarNuevoPeriodo(true)}>
                    + Nueva planificación
                </Button>
            </div>

            {periodos.length === 0 ? (
                <EmptyState
                    iconName="calendar"
                    title="No hay planificaciones"
                    description="Creá una planificación para comenzar a organizar tus horarios de clase."
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {periodos.map((periodo) => (
                            <PlanificacionCard
                                key={periodo.periodoId}
                                periodo={periodo}
                                onClick={(periodoId) => navigate(`/planificacion/${periodoId}`)}
                            />
                        ))}
                    </div>
                    {periodosQuery.hasNextPage && (
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={() => periodosQuery.fetchNextPage()}
                                disabled={periodosQuery.isFetchingNextPage}
                                className="px-6 py-2 text-sm font-medium rounded-lg border-2 border-neon-cyan/60 text-neon-cyan bg-transparent hover:bg-neon-cyan/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.8)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                {periodosQuery.isFetchingNextPage ? (
                                    <>
                                        <Icon name="loading" className="w-4 h-4 animate-spin" />
                                        Cargando...
                                    </>
                                ) : (
                                    'Ver más'
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}

            <NuevoPeriodoModal
                isOpen={mostrarNuevoPeriodo}
                onClose={() => setMostrarNuevoPeriodo(false)}
                onSuccess={(data) => {
                    setMostrarNuevoPeriodo(false);
                    crearPeriodo.mutate({
                        usuarioCarreraId: usuarioCarreraId!,
                        anio: data.anio,
                        instancia: data.instancia,
                        nombre: data.nombre,
                    });
                }}
            />
        </div>
    );
}

export default PlanificacionesPage;

function PlanificacionesSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 mt-1" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <div className="space-y-4">
                            <Skeleton className="h-5 w-36" />
                            <Skeleton className="h-7 w-48" />
                            <div className="space-y-2 pt-4">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-8" />
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <Skeleton className="h-9 w-full" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
