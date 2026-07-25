import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { carrerasService } from '../../services/carreras.service';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { QueryError } from '../common/QueryError';
import { CarreraCard } from './CarreraCard';
import { Icon } from '../ui/Icon';

export function CarrerasPage() {
    const usuario = useAuthStore((s) => s.usuario);
    const usuarioId = usuario?.id ?? usuario?.usuarioId;
    const queryClient = useQueryClient();

    const activas = useInfiniteQuery({
        queryKey: ['carreras', 'activas', usuarioId],
        queryFn: ({ pageParam }) => carrerasService.obtenerCarrerasActivasDelUsuarioPaginado(usuarioId!, pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (lastPage.page < lastPage.totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        enabled: !!usuarioId,
    });

    const inactivas = useInfiniteQuery({
        queryKey: ['carreras', 'inactivas', usuarioId],
        queryFn: ({ pageParam }) => carrerasService.obtenerCarrerasInactivasDelUsuarioPaginado(usuarioId!, pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (lastPage.page < lastPage.totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        enabled: !!usuarioId,
    });

    const disponibles = useInfiniteQuery({
        queryKey: ['carreras', 'disponibles', usuarioId],
        queryFn: ({ pageParam }) => carrerasService.obtenerCarrerasDisponiblesParaUsuario(usuarioId!, pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (lastPage.page < lastPage.totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        enabled: !!usuarioId,
    });

    const isLoading = activas.isLoading || inactivas.isLoading || disponibles.isLoading;
    const error = activas.error ?? inactivas.error ?? disponibles.error;

    if (isLoading) return <CarrerasSkeleton />;

    if (error) {
        return (
            <QueryError
                error={error}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['carreras', 'disponibles', usuarioId] })}
            />
        );
    }

    const activasList = activas.data?.pages.flatMap(p => p.data) ?? [];
    const totalActivas = activas.data?.pages[0]?.total ?? 0;
    const inactivasList = inactivas.data?.pages.flatMap(p => p.data) ?? [];
    const totalInactivas = inactivas.data?.pages[0]?.total ?? 0;
    const restantes = disponibles.data?.pages.flatMap(p => p.data) ?? [];
    const totalDisponibles = disponibles.data?.pages[0]?.total ?? 0;

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-2xl font-bold mb-1">Carreras</h1>
                <p className="text-sm text-slate-400">Gestioná tus inscripciones y explorá el catálogo.</p>
            </div>

            <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    Mis carreras
                    <span className="text-sm font-normal text-slate-400">({totalActivas + totalInactivas})</span>
                </h2>

                {activasList.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-slate-300 mb-3">Activas ({totalActivas})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activasList.map((insc: any) => (
                                <CarreraCard
                                    key={insc.usuarioCarreraId}
                                    carrera={insc.carrera}
                                    inscripto
                                    fechaInicio={insc.fechaInicio}
                                />
                            ))}
                        </div>
                        {activas.hasNextPage && (
                            <div className="flex justify-center mt-4">
                                <button
                                    type="button"
                                    onClick={() => activas.fetchNextPage()}
                                    disabled={activas.isFetchingNextPage}
                                    className="px-6 py-2 text-sm font-medium rounded-lg border-2 border-neon-cyan/60 text-neon-cyan bg-transparent hover:bg-neon-cyan/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.8)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                >
                                    {activas.isFetchingNextPage ? (
                                        <>
                                            <Icon name="loading" className="w-4 h-4 animate-spin" />
                                            Cargando...
                                        </>
                                    ) : (
                                        'Ver más activas'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {inactivasList.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-3">Desinscriptas ({totalInactivas})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {inactivasList.map((insc: any) => (
                                <CarreraCard
                                    key={insc.usuarioCarreraId}
                                    carrera={insc.carrera}
                                    desinscripto
                                    fechaInicio={insc.fechaInicio}
                                />
                            ))}
                        </div>
                        {inactivas.hasNextPage && (
                            <div className="flex justify-center mt-4">
                                <button
                                    type="button"
                                    onClick={() => inactivas.fetchNextPage()}
                                    disabled={inactivas.isFetchingNextPage}
                                    className="px-6 py-2 text-sm font-medium rounded-lg border-2 border-neon-cyan/60 text-neon-cyan bg-transparent hover:bg-neon-cyan/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.8)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                >
                                    {inactivas.isFetchingNextPage ? (
                                        <>
                                            <Icon name="loading" className="w-4 h-4 animate-spin" />
                                            Cargando...
                                        </>
                                    ) : (
                                        'Ver más desinscriptas'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activasList.length === 0 && inactivasList.length === 0 && (
                    <Card>
                        <p className="text-slate-400 text-center py-6">
                            Aún no estás inscripto en ninguna carrera.
                        </p>
                    </Card>
                )}
            </section>

            <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    Carreras disponibles
                    <span className="text-sm font-normal text-slate-400">({totalDisponibles})</span>
                </h2>
                {restantes.length === 0 && !disponibles.isFetching ? (
                    <Card>
                        <p className="text-slate-400 text-center py-6">
                            No hay más carreras disponibles para inscribirte.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {restantes.map((carrera: any) => (
                                <CarreraCard key={carrera.carreraId} carrera={carrera} />
                            ))}
                        </div>
                        {disponibles.hasNextPage && (
                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => disponibles.fetchNextPage()}
                                    disabled={disponibles.isFetchingNextPage}
                                    className="px-6 py-2 text-sm font-medium rounded-lg border-2 border-neon-cyan/60 text-neon-cyan bg-transparent hover:bg-neon-cyan/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.8)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                >
                                    {disponibles.isFetchingNextPage ? (
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
                    </div>
                )}
            </section>
        </div>
    );
}

function CarrerasSkeleton() {
    return (
        <div className="space-y-10">
            <div>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-80 mt-2" />
            </div>
            {[0, 1].map((s) => (
                <div key={s} className="space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <Card key={i}>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-36" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                    <div className="space-y-2">
                                        {[...Array(2)].map((_, j) => (
                                            <div key={j} className="flex justify-between">
                                                <Skeleton className="h-3 w-24" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-2 border-t">
                                        <Skeleton className="h-9 w-full" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
