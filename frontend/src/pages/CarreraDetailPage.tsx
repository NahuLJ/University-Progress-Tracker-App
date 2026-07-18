import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { PlanEstudiosTree } from '../components/carrera/PlanEstudiosTree';
import { MateriaDetailModal } from '../components/carrera/MateriaDetailModal';
import { InscribirCarreraModal } from '../components/carrera/InscribirCarreraModal';
import { usePlanEstudios } from '../hooks/usePlanEstudios';
import { useCarreras } from '../hooks/useCarreras';
import { EmptyState } from '../components/common/EmptyState';
import { QueryError } from '../components/common/QueryError';
import { useQueryClient } from '@tanstack/react-query';

export function CarreraDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [vistaActiva, setVistaActiva] = useState<'arbol' | 'tabla'>('arbol');
    const [mostrarInscribirModal, setMostrarInscribirModal] = useState(false);
    const [materiaSeleccionada, setMateriaSeleccionada] = useState<any>(null);

    const usuarioCarrera = useCarreras();
    const inscripto = usuarioCarrera.data?.some(c => c.carreraId === parseInt(id!));

    const {
        data: planEstudios,
        isLoading,
        error,
        refetch,
    } = usePlanEstudios(parseInt(id!));

    const queryClient = useQueryClient();

    if (isLoading) {
        return <CarreraDetailSkeleton />;
    }

    if (error) {
        return (
            <QueryError
                error={error}
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['plan-estudios', parseInt(id!)] })}
            />
        );
    }

    if (!planEstudios) {
        return (
            <EmptyState
                iconName="search"
                title="Carrera no encontrada"
                description="La carrera que estás buscando no existe o no está disponible."
                action={<Link to="/carreras" className="btn-primary">Ver otras carreras</Link>}
            />
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">{planEstudios.carrera.nombre}</h1>
                        <p className="text-slate-300 mb-4">{planEstudios.carrera.descripcion}</p>
                    </div>
                    <div className="text-right">
                        {inscripto ? (
                            <div>
                                <Badge variant="success" className="mb-2 block w-fit">
                                    Inscripto
                                </Badge>
                                <p className="text-sm text-slate-400">
                                    Fecha: {new Date(usuarioCarrera.data?.find(c => c.carreraId === parseInt(id!))?.fechaInicio || '').toLocaleDateString('es-AR')}
                                </p>
                            </div>
                        ) : (
                            <Button onClick={() => setMostrarInscribirModal(true)}>
                                Inscribirse a esta carrera
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-300">
                        {planEstudios.anios.length} años de estudios
                        • {planEstudios.anios.reduce((acc: number, anio: { cuatrimestres: any[] }) => acc + anio.cuatrimestres.reduce((acc2: number, cuat: { materias: any[] }) => acc2 + cuat.materias.length, 0), 0)} materias totales
                        • {planEstudios.carrera.creditosTotales} créditos totales
                    </div>
                    {planEstudios.anios.length > 1 && (
                        <div className="flex gap-2">
                            <Button
                                variant={vistaActiva === 'arbol' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setVistaActiva('arbol')}
                            >
                                Vista árbol
                            </Button>
                            <Button
                                variant={vistaActiva === 'tabla' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setVistaActiva('tabla')}
                            >
                                Vista tabla
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            <Card title="Plan de estudios">
                {vistaActiva === 'arbol' ? (
                    <PlanEstudiosTree
                        planEstudios={planEstudios}
                        onMateriaClick={(materia) => setMateriaSeleccionada(materia)}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4">Código</th>
                                    <th className="text-left py-3 px-4">Materia</th>
                                    <th className="text-left py-3 px-4">Año</th>
                                    <th className="text-left py-3 px-4">Cuatrimestre</th>
                                    <th className="text-left py-3 px-4">Orden</th>
                                    <th className="text-left py-3 px-4">Créditos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {planEstudios.anios.flatMap(anio =>
                                    anio.cuatrimestres.flatMap(cuatrimestre =>
                                        cuatrimestre.materias.map(materia => (
                                    <tr key={materia.materiaId} className="border-b border-base-600 hover:bg-base-700/50">
                                        <td className="py-3 px-4 font-mono text-sm text-slate-300">{materia.codigo}</td>
                                        <td className="py-3 px-4">
                                                <button
                                                    onClick={() => setMateriaSeleccionada(materia)}
                                                    className="text-neon-cyan hover:text-cyan-300 font-medium text-left"
                                                >
                                                        {materia.nombre}
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4">{anio.anio}</td>
                                                <td className="py-3 px-4">{cuatrimestre.cuatrimestre}</td>
                                                <td className="py-3 px-4">{materia.orden}</td>
                                                <td className="py-3 px-4">{materia.creditos}</td>
                                            </tr>
                                        ))
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <InscribirCarreraModal
                isOpen={mostrarInscribirModal}
                onClose={() => setMostrarInscribirModal(false)}
                onSuccess={() => {
                    setMostrarInscribirModal(false);
                    refetch();
                }}
            />

            <MateriaDetailModal
                isOpen={!!materiaSeleccionada}
                onClose={() => setMateriaSeleccionada(null)}
                materia={materiaSeleccionada}
            />
        </div>
    );
}

function CarreraDetailSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <Skeleton className="h-8 w-64 mb-4" />
                <Skeleton className="h-4 w-96 mb-4" />
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-20 w-32" />
                </div>
            </Card>
            <Card>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex gap-4 py-3 border-b">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-64" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}