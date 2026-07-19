import { useQuery, useQueryClient } from '@tanstack/react-query';
import { carrerasService } from '../../services/carreras.service';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { QueryError } from '../common/QueryError';
import { CarreraCard } from './CarreraCard';

export function CarrerasPage() {
    const usuario = useAuthStore((s) => s.usuario);
    const usuarioId = usuario?.id ?? usuario?.usuarioId;
    const queryClient = useQueryClient();

    const misCarreras = useQuery({
        queryKey: ['carreras', usuarioId],
        queryFn: () => carrerasService.obtenerCarrerasDelUsuario(usuarioId!),
        enabled: !!usuarioId,
    });

    const disponibles = useQuery({
        queryKey: ['carreras', 'disponibles', usuarioId],
        queryFn: () => carrerasService.obtenerCarrerasDisponiblesParaUsuario(usuarioId!),
        enabled: !!usuarioId,
    });

    const isLoading = misCarreras.isLoading || disponibles.isLoading;
    const error = misCarreras.error ?? disponibles.error;

    if (isLoading) return <CarrerasSkeleton />;

    if (error) {
        return (
            <QueryError
                error={error}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['carreras', 'disponibles', usuarioId] })}
            />
        );
    }

    const todasLasInscritas = misCarreras.data ?? [];
    const activas = todasLasInscritas.filter((i: any) => i.activo);
    const inactivas = todasLasInscritas.filter((i: any) => !i.activo);
    const restantes = disponibles.data ?? [];

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-2xl font-bold mb-1">Carreras</h1>
                <p className="text-sm text-slate-400">Gestioná tus inscripciones y explorá el catálogo.</p>
            </div>

            <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    Mis carreras
                    <span className="text-sm font-normal text-slate-400">({todasLasInscritas.length})</span>
                </h2>
                {todasLasInscritas.length === 0 ? (
                    <Card>
                        <p className="text-slate-400 text-center py-6">
                            Aún no estás inscripto en ninguna carrera.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {activas.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-slate-300 mb-3">Activas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activas.map((insc: any) => (
                                        <CarreraCard
                                            key={insc.usuarioCarreraId}
                                            carrera={insc.carrera}
                                            inscripto
                                            fechaInicio={insc.fechaInicio}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {inactivas.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-slate-300 mb-3">Desinscriptas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {inactivas.map((insc: any) => (
                                        <CarreraCard
                                            key={insc.usuarioCarreraId}
                                            carrera={insc.carrera}
                                            desinscripto
                                            fechaInicio={insc.fechaInicio}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    Carreras disponibles
                    <span className="text-sm font-normal text-slate-400">({restantes.length})</span>
                </h2>
                {restantes.length === 0 ? (
                    <Card>
                        <p className="text-slate-400 text-center py-6">
                            No hay más carreras disponibles para inscribirte.
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {restantes.map((carrera: any) => (
                            <CarreraCard key={carrera.carreraId} carrera={carrera} />
                        ))}
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
