import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { QueryError } from '../components/common/QueryError';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCarreraActiva } from '../hooks/useCarreras';
import { useTrayectoria } from '../hooks/useTrayectoria';

const nuevaTrayectoriaSchema = z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio').max(150),
});

type NuevaTrayectoriaFormData = z.infer<typeof nuevaTrayectoriaSchema>;

export function TrayectoriasPage() {
    const { usuarioCarreraId, carreraActiva, isLoading: cargandoCarrera } = useCarreraActiva();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { trayectorias, trayectoriasLoading, trayectoriasError, crearTrayectoria } = useTrayectoria(usuarioCarreraId);
    const [mostrarNueva, setMostrarNueva] = useState(false);

    const form = useForm<NuevaTrayectoriaFormData>({
        resolver: zodResolver(nuevaTrayectoriaSchema),
        defaultValues: { nombre: '' },
    });

    const isLoading = cargandoCarrera || trayectoriasLoading;

    if (isLoading) {
        return <TrayectoriasSkeleton />;
    }

    if (trayectoriasError) {
        return (
            <QueryError
                error={trayectoriasError}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['trayectorias', usuarioCarreraId] })}
            />
        );
    }

    if (!usuarioCarreraId) {
        return (
            <EmptyState
                iconName="calendar"
                title="No tenés carreras registradas"
                description="Inscribite a una carrera para crear trayectorias de planificación."
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
                        <h1 className="text-2xl font-bold">Trayectorias</h1>
                        {trayectorias.length > 0 && (
                            <span className="badge badge-info">
                                {trayectorias.length}
                            </span>
                        )}
                    </div>
                    {carreraActiva?.carrera?.nombre && (
                        <div className="flex items-center gap-1.5 mt-1">
                            <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-sm font-medium text-text-default">{carreraActiva.carrera.nombre}</span>
                        </div>
                    )}
                    <p className="text-sm text-text-muted mt-1">
                        Agrupá planificaciones en cadena para planificar a largo plazo. Las materias planificadas en un período
                        desbloquean correlativas para los siguientes, permitiendo un camino de planeación sucesivo.
                    </p>
                </div>
                <Button variant="primary" onClick={() => setMostrarNueva(true)}>
                    + Nueva trayectoria
                </Button>
            </div>

            {trayectorias.length === 0 ? (
                <EmptyState
                    iconName="calendar"
                    title="No hay trayectorias"
                    description="Una trayectoria agrupa planificaciones sucesivas para planificar a largo plazo."
                    action={
                        <Button variant="primary" onClick={() => setMostrarNueva(true)}>
                            Crear primera trayectoria
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trayectorias.map((t) => (
                        <TrayectoriaCard
                            key={t.trayectoriaId}
                            trayectoria={t}
                            onClick={() => navigate(`/trayectoria/${t.trayectoriaId}`)}
                        />
                    ))}
                </div>
            )}

            <Modal isOpen={mostrarNueva} onClose={() => { setMostrarNueva(false); form.reset(); }} title="Nueva trayectoria" size="sm">
                <form onSubmit={form.handleSubmit((data) => {
                    crearTrayectoria.mutate(
                        { usuarioCarreraId: usuarioCarreraId!, nombre: data.nombre },
                        {
                            onSuccess: () => {
                                setMostrarNueva(false);
                                form.reset();
                            },
                        },
                    );
                })} noValidate className="space-y-4">
                    <Input
                        label="Nombre"
                        placeholder="Ej: Inteligencia Artificial, Redes, etc."
                        error={form.formState.errors.nombre?.message}
                        {...form.register('nombre')}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => { setMostrarNueva(false); form.reset(); }}>
                            Cancelar
                        </Button>
                        <Button type="submit" loading={crearTrayectoria.isPending}>Crear trayectoria</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default TrayectoriasPage;

function TrayectoriaCard({ trayectoria, onClick }: { trayectoria: import('../types/planificacion.types').Trayectoria; onClick: () => void }) {
    const cantidad = trayectoria.planificaciones?.length ?? 0;
    return (
        <Card
            className="group cursor-pointer hover:bg-bg-surface-secondary transition-colors"
            onClick={onClick}
        >
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text-default">
                        {trayectoria.nombre}
                    </h3>
                    <span className="text-xs text-text-muted">{new Date(trayectoria.creadoEn).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-text-muted">
                    {cantidad === 0
                        ? 'Sin planificaciones'
                        : `${cantidad} planificación${cantidad !== 1 ? 'es' : ''}`}
                </p>
                <div className="pt-2">
                    <Button variant="primary" className="w-full text-sm">
                        Ver trayectoria
                    </Button>
                </div>
            </div>
        </Card>
    );
}

function TrayectoriasSkeleton() {
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
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
