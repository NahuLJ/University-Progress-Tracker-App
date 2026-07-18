import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { carrerasService } from '../../services/carreras.service';
import {
    useInscribirCarrera,
    useDesinscribirCarrera,
} from '../../hooks/useCarreras';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { QueryError } from '../common/QueryError';
import { CarreraCard } from './CarreraCard';

export function CarrerasPage() {
    const usuario = useAuthStore((s) => s.usuario);
    const usuarioId = usuario?.id ?? usuario?.usuarioId;
    const queryClient = useQueryClient();

    const disponibles = useQuery({
        queryKey: ['carreras', 'disponibles'],
        queryFn: () => carrerasService.obtenerCarrerasDisponibles(),
    });

    const inscripciones = useQuery({
        queryKey: ['carreras', usuarioId],
        queryFn: () => carrerasService.obtenerCarrerasDelUsuario(usuarioId!),
        enabled: !!usuarioId,
    });

    const inscribirCarrera = useInscribirCarrera();
    const desinscribirCarrera = useDesinscribirCarrera();

    const [inscribiendoId, setInscribiendoId] = useState<number | null>(null);
    const [desinscribiendoId, setDesinscribiendoId] = useState<number | null>(null);

    const mapaInscripciones = useMemo(() => {
        const map = new Map<number, { usuarioCarreraId: number; fechaInicio: string }>();
        inscripciones.data?.forEach((i) =>
            map.set(i.carreraId, {
                usuarioCarreraId: i.usuarioCarreraId,
                fechaInicio: i.fechaInicio,
            }),
        );
        return map;
    }, [inscripciones.data]);

    const isLoading = disponibles.isLoading || inscripciones.isLoading;
    const error = disponibles.error ?? inscripciones.error;

    const handleInscribir = (carreraId: number) => {
        if (!usuarioId) return;
        setInscribiendoId(carreraId);
        inscribirCarrera.mutate(
            { carreraId, fechaInicio: new Date().toISOString().split('T')[0] },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['carreras', usuarioId] });
                    setInscribiendoId(null);
                },
                onError: () => setInscribiendoId(null),
            },
        );
    };

    const handleDesinscribir = (usuarioCarreraId: number, nombre: string) => {
        if (!usuarioId) return;
        if (!confirm(`¿Desinscribirse de ${nombre}?`)) return;
        setDesinscribiendoId(usuarioCarreraId);
        desinscribirCarrera.mutate(usuarioCarreraId, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['carreras', usuarioId] });
                setDesinscribiendoId(null);
            },
            onError: () => setDesinscribiendoId(null),
        });
    };

    if (isLoading) return <CarrerasSkeleton />;

    if (error) {
        return (
            <QueryError
                error={error}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['carreras', 'disponibles'] })}
            />
        );
    }

    const carreras = disponibles.data ?? [];

    if (carreras.length === 0) {
        return (
            <EmptyState
                iconName="school"
                title="No hay carreras disponibles"
                description="Aún no se han cargado carreras en el catálogo."
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Carreras</h1>
                <span className="text-sm text-slate-400">{carreras.length} disponibles</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {carreras.map((carrera) => {
                    const insc = mapaInscripciones.get(carrera.carreraId);
                    const inscripto = !!insc;
                    return (
                        <CarreraCard
                            key={carrera.carreraId}
                            carrera={carrera}
                            inscripto={inscripto}
                            fechaInicio={insc?.fechaInicio}
                            inscribiendo={inscribiendoId === carrera.carreraId}
                            desinscribiendo={desinscribiendoId === insc?.usuarioCarreraId}
                            onInscribir={() => handleInscribir(carrera.carreraId)}
                            onDesinscribir={
                                insc
                                    ? () => handleDesinscribir(insc.usuarioCarreraId, carrera.nombre)
                                    : undefined
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
}

function CarrerasSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-10 w-48" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
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
    );
}
