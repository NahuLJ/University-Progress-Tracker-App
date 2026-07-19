import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { PlanEstudiosTree } from '../components/carrera/PlanEstudiosTree';
import { MateriaDetailModal } from '../components/carrera/MateriaDetailModal';
import { InscribirCarreraModal } from '../components/carrera/InscribirCarreraModal';
import { DesinscribirCarreraModal } from '../components/carrera/DesinscribirCarreraModal';
import { usePlanEstudios } from '../hooks/usePlanEstudios';
import { useCarreras, useDesinscribirCarrera, useReactivarCarrera, useEliminarCarreraDefinitivamente } from '../hooks/useCarreras';
import { EmptyState } from '../components/common/EmptyState';
import { QueryError } from '../components/common/QueryError';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../components/ui/Modal';
import { useCarreraStore } from '../store/carrera.store';
import { StatusBadge } from '../components/ui/StatusBadge';

export function CarreraDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [vistaActiva, setVistaActiva] = useState<'arbol' | 'tabla'>('arbol');
    const [mostrarInscribirModal, setMostrarInscribirModal] = useState(false);
    const [mostrarDesinscribirModal, setMostrarDesinscribirModal] = useState(false);
    const [materiaSeleccionada, setMateriaSeleccionada] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ usuarioCarreraId: number; carreraNombre: string } | null>(null);
    const [confirmReactivar, setConfirmReactivar] = useState<{ usuarioCarreraId: number; carreraNombre: string } | null>(null);

    const usuarioCarrera = useCarreras();
    const desinscribirCarrera = useDesinscribirCarrera();
    const reactivarCarrera = useReactivarCarrera();
    const eliminarCarreraDefinitivamente = useEliminarCarreraDefinitivamente();

    const usuarioCarreraId = useCarreraStore((s) => s.usuarioCarreraId);
    const inscripcionActual = usuarioCarrera.data?.find(c => c.carrera?.carreraId === parseInt(id!));
    const inscripto = inscripcionActual?.activo === true;
    const desinscripto = inscripcionActual?.activo === false;

    const {
        data: planEstudios,
        isLoading,
        error,
        refetch,
    } = usePlanEstudios(parseInt(id!), usuarioCarreraId);

    const queryClient = useQueryClient();

    const handleAbrirDesinscribir = () => {
        if (!inscripcionActual || !planEstudios) return;
        setMostrarDesinscribirModal(true);
    };

    const handleDesinscribirConfirmado = (usuarioCarreraId: number) => {
        desinscribirCarrera.mutate(usuarioCarreraId, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['carreras'] });
                queryClient.invalidateQueries({ queryKey: ['plan-estudios', parseInt(id!)] });
                setMostrarDesinscribirModal(false);
            },
        });
    };

    const handleReactivar = (usuarioCarreraId: number, carreraNombre: string) => {
        setConfirmReactivar({ usuarioCarreraId, carreraNombre });
    };

    const handleReactivarConfirmed = () => {
        if (!confirmReactivar) return;
        reactivarCarrera.mutate(confirmReactivar.usuarioCarreraId, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['carreras'] });
                queryClient.invalidateQueries({ queryKey: ['plan-estudios', parseInt(id!)] });
                setConfirmReactivar(null);
            },
        });
    };

    const handleEliminarDefinitivo = (usuarioCarreraId: number, carreraNombre: string) => {
        setConfirmDelete({ usuarioCarreraId, carreraNombre });
    };

    const handleConfirmDelete = () => {
        if (!confirmDelete) return;
        eliminarCarreraDefinitivamente.mutate(confirmDelete.usuarioCarreraId, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['carreras'] });
                queryClient.invalidateQueries({ queryKey: ['plan-estudios', parseInt(id!)] });
                setConfirmDelete(null);
            },
        });
    };

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
                            <div className="flex flex-col items-end gap-2">
                                <Badge variant="success" className="mb-2 w-fit">
                                    Inscripto
                                </Badge>
                                <p className="text-sm text-slate-400">
                                    Fecha: {new Date(inscripcionActual?.fechaInicio || '').toLocaleDateString('es-AR')}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleAbrirDesinscribir}
                                        className="px-3 py-1.5 text-sm font-medium rounded-lg border-2 border-neon-red/60 text-neon-red bg-transparent hover:bg-neon-red/10 hover:shadow-[0_0_10px_rgba(248,113,113,0.8)] transition-all"
                                    >
                                        Desinscribirse
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleEliminarDefinitivo(inscripcionActual!.usuarioCarreraId, planEstudios.carrera.nombre)}
                                        className="px-3 py-1.5 text-sm font-medium rounded-lg border-2 border-neon-red/60 text-neon-red bg-transparent hover:bg-neon-red/10 hover:shadow-[0_0_10px_rgba(248,113,113,0.8)] transition-all"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ) : desinscripto ? (
                            <div className="flex flex-col items-end gap-2">
                                <Badge variant="warning" className="mb-2 w-fit">
                                    Desinscripto
                                </Badge>
                                <p className="text-sm text-slate-400">
                                    Fecha: {new Date(inscripcionActual?.fechaInicio || '').toLocaleDateString('es-AR')}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleReactivar(inscripcionActual!.usuarioCarreraId, planEstudios.carrera.nombre)}
                                        className="px-3 py-1.5 text-sm font-medium rounded-lg border-2 border-neon-cyan/60 text-neon-cyan bg-transparent hover:bg-neon-cyan/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all"
                                    >
                                        Volver a inscribirse
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleEliminarDefinitivo(inscripcionActual!.usuarioCarreraId, planEstudios.carrera.nombre)}
                                        className="px-3 py-1.5 text-sm font-medium rounded-lg border-2 border-neon-red/60 text-neon-red bg-transparent hover:bg-neon-red/10 hover:shadow-[0_0_10px_rgba(248,113,113,0.8)] transition-all"
                                    >
                                        Eliminar definitivamente
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setMostrarInscribirModal(true)}
                                className="px-4 py-2 text-base font-medium rounded-lg border-2 border-neon-cyan/60 text-neon-cyan bg-transparent hover:bg-neon-cyan/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all"
                            >
                                Inscribirse a esta carrera
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-300">
                        {planEstudios.anios.length} años de estudios
                        • {planEstudios.anios.reduce((acc: number, anio: { cuatrimestres: any[] }) => acc + anio.cuatrimestres.reduce((acc2: number, cuat: { materias: any[] }) => acc2 + cuat.materias.length, 0), 0)} materias totales
                        • {planEstudios.carrera.creditosTotales} créditos totales
                    </div>
                </div>
            </Card>

            <Card className="relative">
                <div className="flex items-center justify-between px-6 py-4 border-b border-base-600">
                    <h3 className="text-lg font-semibold text-white">Plan de estudios</h3>
                    {planEstudios.anios.length > 1 && (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setVistaActiva('arbol')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                                    vistaActiva === 'arbol'
                                        ? 'bg-neon-cyan text-base-900'
                                        : 'border-2 border-neon-cyan/60 text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-neon-cyan'
                                }`}
                            >
                                Vista árbol
                            </button>
                            <button
                                type="button"
                                onClick={() => setVistaActiva('tabla')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                                    vistaActiva === 'tabla'
                                        ? 'bg-neon-cyan text-base-900'
                                        : 'border-2 border-neon-cyan/60 text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-neon-cyan'
                                }`}
                            >
                                Vista tabla
                            </button>
                        </div>
                    )}
                </div>
                {planEstudios.anios.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <p className="text-lg mb-2">Esta carrera no tiene plan de estudios cargado</p>
                        <p className="text-sm">Contactá a un administrador para configurar el plan de estudios.</p>
                    </div>
                ) : vistaActiva === 'arbol' ? (
                    <PlanEstudiosTree
                        planEstudios={planEstudios}
                        onMateriaClick={(materia) => setMateriaSeleccionada(materia)}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-base-600">
                                    <th className="text-center py-3 px-4">Nro</th>
                                    <th className="text-center py-3 px-4">Código</th>
                                    <th className="text-center py-3 px-4">Materia</th>
                                    <th className="text-center py-3 px-4">Año</th>
                                    <th className="text-center py-3 px-4">Cuatrimestre</th>
                                    <th className="text-center py-3 px-4">Créditos</th>
                                    <th className="text-center py-3 px-4">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {planEstudios.anios.flatMap(anio =>
                                    anio.cuatrimestres.flatMap(cuatrimestre =>
                                        cuatrimestre.materias.map(materia => (
                                    <tr key={materia.materiaId} className="border-b border-base-600 hover:bg-base-700/50">
                                        <td className="text-center py-3 px-4 text-slate-300">{materia.orden}</td>
                                        <td className="text-center py-3 px-4 font-mono text-sm text-slate-300">{materia.codigo}</td>
                                        <td className="text-center py-3 px-4">
                                                <button
                                                    onClick={() => setMateriaSeleccionada(materia)}
                                                    className="text-neon-cyan hover:text-cyan-300 font-medium text-center"
                                                >
                                                        {materia.nombre}
                                                    </button>
                                            </td>
                                            <td className="text-center py-3 px-4">{anio.anio}</td>
                                            <td className="text-center py-3 px-4">{cuatrimestre.cuatrimestre}</td>
                                            <td className="text-center py-3 px-4">{materia.creditos}</td>
                                            <td className="text-center py-3 px-4">
                                                <StatusBadge estado={materia.estadoUsuario || 'Pendiente'} />
                                            </td>
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
    carreraId={parseInt(id!)}
    carreraNombre={planEstudios?.carrera.nombre || ''}
/>

<DesinscribirCarreraModal
    isOpen={mostrarDesinscribirModal}
    onClose={() => setMostrarDesinscribirModal(false)}
    onSuccess={handleDesinscribirConfirmado}
    carreraId={inscripcionActual?.usuarioCarreraId || 0}
    carreraNombre={planEstudios?.carrera.nombre || ''}
/>

<Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar inscripción definitivamente" size="md">
    <div className="space-y-4">
        <p>
            ¿Estás seguro de que querés eliminar definitivamente tu inscripción a <strong>{confirmDelete?.carreraNombre}</strong>?
        </p>
        <p className="text-sm text-slate-300">
            Esto eliminará todo tu progreso académico y planificación asociada a esta carrera. <strong>Esta acción no se puede deshacer.</strong>
        </p>
        <div className="flex justify-end gap-2 pt-4">
            <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border-2 border-neon-red/60 text-neon-red bg-transparent hover:bg-neon-red/10 hover:shadow-[0_0_10px_rgba(248,113,113,0.8)] transition-all"
            >
                Eliminar definitivamente
            </button>
        </div>
    </div>
</Modal>

<Modal isOpen={!!confirmReactivar} onClose={() => setConfirmReactivar(null)} title="Volver a inscribirse" size="sm">
    <div className="space-y-4">
        <p>
            ¿Estás seguro de que querés volver a inscribirte en <strong>{confirmReactivar?.carreraNombre}</strong>?
        </p>
        <div className="flex justify-end gap-2 pt-4">
            <button
                type="button"
                onClick={() => setConfirmReactivar(null)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={handleReactivarConfirmed}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border-2 border-neon-cyan/60 text-neon-cyan bg-transparent hover:bg-neon-cyan/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all"
            >
                Confirmar
            </button>
        </div>
    </div>
</Modal>

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