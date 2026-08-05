import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { PlanEstudiosTree } from '../components/carrera/PlanEstudiosTree';
import { MateriaDetailModal } from '../components/carrera/MateriaDetailModal';
import { InscribirCarreraModal } from '../components/carrera/InscribirCarreraModal';
import { DesinscribirCarreraModal } from '../components/carrera/DesinscribirCarreraModal';
import { usePlanEstudios } from '../hooks/usePlanEstudios';
import { useCarreras, useDesinscribirCarrera, useReactivarCarrera, useEliminarCarreraDefinitivamente } from '../hooks/useCarreras';
import { EmptyState } from '../components/common/EmptyState';
import { QueryError } from '../components/common/QueryError';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Icon } from '../components/ui/Icon';
import { creditosService } from '../services/creditos.service';
import { SistemaCreditosCard } from '../components/creditos/SistemaCreditosCard';

export function CarreraDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [vistaActiva, setVistaActiva] = useState<'arbol' | 'tabla'>('arbol');
    const [mostrarInscribirModal, setMostrarInscribirModal] = useState(false);
    const [mostrarDesinscribirModal, setMostrarDesinscribirModal] = useState(false);
    const [materiaSeleccionada, setMateriaSeleccionada] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ usuarioCarreraId: number; carreraNombre: string } | null>(null);
    const [expandirSignal, setExpandirSignal] = useState(0);
    const [contraerSignal, setContraerSignal] = useState(0);
    const [confirmReactivar, setConfirmReactivar] = useState<{ usuarioCarreraId: number; carreraNombre: string } | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    const usuarioCarrera = useCarreras();
    const desinscribirCarrera = useDesinscribirCarrera();
    const reactivarCarrera = useReactivarCarrera();
    const eliminarCarreraDefinitivamente = useEliminarCarreraDefinitivamente();

    const inscripcionActual = usuarioCarrera.data?.find(c => c.carrera?.carreraId === parseInt(id!));
    const inscripto = inscripcionActual?.activo === true;
    const desinscripto = inscripcionActual?.activo === false;

    const {
        data: planEstudios,
        isLoading,
        error,
        refetch,
    } = usePlanEstudios(parseInt(id!), inscripcionActual?.usuarioCarreraId);

    const carreraIdNum = parseInt(id!);
    const { data: configCreditos } = useQuery({
        queryKey: ['creditos', 'carrera', carreraIdNum, inscripcionActual?.usuarioCarreraId],
        queryFn: () =>
            creditosService.obtenerConfiguracionCarrera(
                carreraIdNum,
                inscripcionActual?.usuarioCarreraId,
            ),
        enabled: !!carreraIdNum,
    });

    const queryClient = useQueryClient();

    const handleDesinscribirConfirmado = () => {
        if (!inscripcionActual) return;
        desinscribirCarrera.mutate(inscripcionActual.usuarioCarreraId, {
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
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-text-muted hover:text-text-default transition-colors"
            >
                <Icon name="arrowLeft" className="w-5 h-5" />
            </button>
<Card>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-lg font-semibold text-text-default mb-2">{planEstudios.carrera.nombre}</h1>
                        <p className="text-text-subtle mb-4">{planEstudios.carrera.descripcion}</p>
                    </div>
                    <div className="text-right">
                        {inscripto ? (
                            <div className="flex flex-col items-end gap-2">
                                <Badge variant="success" className="mb-2 w-fit">
                                    Inscripto
                                </Badge>
                                <p className="text-sm text-text-muted">
                                    Fecha: {new Date(inscripcionActual?.fechaInicio || '').toLocaleDateString('es-AR')}
                                </p>
                            </div>
                        ) : desinscripto ? (
                            <div className="flex flex-col items-end gap-2">
                                <Badge variant="warning" className="mb-2 w-fit">
                                    Desinscripto
                                </Badge>
                                <p className="text-sm text-text-muted">
                                    Fecha: {new Date(inscripcionActual?.fechaInicio || '').toLocaleDateString('es-AR')}
                                </p>
                            </div>
                        ) : (
                            <Button
                                variant="success"
                                onClick={() => setMostrarInscribirModal(true)}
                            >
                                Inscribirse a esta carrera
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <div className="text-sm text-text-subtle">
                        {planEstudios.anios.length} años de estudios
                        • {planEstudios.anios.reduce((acc: number, anio: { cuatrimestres: any[] }) => acc + anio.cuatrimestres.reduce((acc2: number, cuat: { materias: any[] }) => acc2 + cuat.materias.length, 0), 0)} materias totales
                        • {planEstudios.materias.reduce((acc: number, m: { creditos: number }) => acc + m.creditos, 0)} créditos totales
                    </div>
                    <div className="flex gap-2">
                        {inscripto ? (
                            <>
                                <Button
                                    variant="warning"
                                    onClick={() => setMostrarDesinscribirModal(true)}
                                    className="text-sm"
                                >
                                    Desinscribirse
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={() => handleEliminarDefinitivo(inscripcionActual!.usuarioCarreraId, planEstudios.carrera.nombre)}
                                    className="text-sm"
                                >
                                    Eliminar
                                </Button>
                            </>
                        ) : desinscripto ? (
                            <>
                                <Button
                                    variant="warning"
                                    onClick={() => handleReactivar(inscripcionActual!.usuarioCarreraId, planEstudios.carrera.nombre)}
                                    className="text-sm"
                                >
                                    Volver a inscribirse
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={() => handleEliminarDefinitivo(inscripcionActual!.usuarioCarreraId, planEstudios.carrera.nombre)}
                                    className="text-sm"
                                >
                                    Eliminar definitivamente
                                </Button>
                            </>
                        ) : null}
                    </div>
                </div>
            </Card>

            {configCreditos?.sistemaCreditos && (
                <SistemaCreditosCard config={configCreditos} mostrarProgreso={inscripto} />
            )}

            {planEstudios.anios.length > 1 && (
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setVistaActiva('arbol')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            vistaActiva === 'arbol'
                                ? 'bg-accent-primary text-accent-foreground'
                                : 'bg-transparent border border-hairline text-text-muted hover:text-text-default hover:bg-bg-surface-secondary'
                        }`}
                    >
                        Vista árbol
                    </button>
                    <button
                        type="button"
                        onClick={() => setVistaActiva('tabla')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            vistaActiva === 'tabla'
                                ? 'bg-accent-primary text-accent-foreground'
                                : 'bg-transparent border border-hairline text-text-muted hover:text-text-default hover:bg-bg-surface-secondary'
                        }`}
                    >
                        Vista tabla
                    </button>
                </div>
            )}

            <Card className="relative">
                <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-text-default">Plan de estudios</h3>
                        <span className="badge badge-info">
                            {planEstudios.anios.reduce((acc: number, anio: { cuatrimestres: { materias: any[] }[] }) => acc + anio.cuatrimestres.reduce((acc2: number, cuat: { materias: any[] }) => acc2 + cuat.materias.length, 0), 0)} materias
                        </span>
                    </div>
                    {vistaActiva === 'arbol' && planEstudios.anios.length > 0 && (
                        <div className="flex gap-2">
                                <button
                                type="button"
                                onClick={() => setExpandirSignal((prev) => prev + 1)}
                                className="btn-ghost"
                            >
                                Expandir todo
                            </button>
                            <button
                                type="button"
                                onClick={() => setContraerSignal((prev) => prev + 1)}
                                className="btn-danger"
                            >
                                Contraer todo
                            </button>
                        </div>
                    )}
                </div>
                {planEstudios.anios.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">
                        <p className="text-sm mb-2">Esta carrera no tiene plan de estudios cargado</p>
                        <p className="text-sm">Contactá a un administrador para configurar el plan de estudios.</p>
                    </div>
                ) : vistaActiva === 'arbol' ? (
                    <PlanEstudiosTree
                        planEstudios={planEstudios}
                        onMateriaClick={(materia) => setMateriaSeleccionada(materia)}
                        expandirSignal={expandirSignal}
                        contraerSignal={contraerSignal}
                    />
                ) : (
                    <div className="divide-y divide-hairline">
                        {planEstudios.anios.map(anio => (
                            <div key={anio.anio}>
                                <div className="px-4 py-3 bg-bg-surface-secondary flex items-center gap-3">
                                    <h4 className="text-sm font-semibold text-text-default">{anio.anio}° Año</h4>
                                    <span className="badge badge-info">
                                        {anio.cuatrimestres.reduce((s: number, c: { materias: any[] }) => s + c.materias.length, 0)}
                                    </span>
                                </div>
                                {anio.cuatrimestres.map(cuatrimestre => (
                                    <div key={cuatrimestre.cuatrimestre}>
                                        <div className="px-4 py-2 bg-bg-surface border-b border-hairline flex items-center gap-3">
                                            <span className="text-xs font-medium text-text-subtle">{cuatrimestre.cuatrimestre}° Cuatrimestre</span>
                                            <span className="badge badge-info">{cuatrimestre.materias.length}</span>
                                        </div>
                                        <div>
                                            <div className="grid grid-cols-12 gap-2 px-4 py-2 label border-b border-hairline">
                                                <div className="col-span-1 text-center">Nro</div>
                                                <div className="col-span-2 text-center">Código</div>
                                                <div className="col-span-3 text-center">Materia</div>
                                                <div className="col-span-2 text-center">Créditos</div>
                                                <div className="col-span-2 text-center">Carga Horaria</div>
                                                <div className="col-span-2 text-center">Estado</div>
                                            </div>
                                            {cuatrimestre.materias.map(materia => (
                                                <div key={materia.materiaId} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-bg-surface-secondary border-b border-hairline">
                                                    <span className="col-span-1 text-center text-text-subtle text-sm">{materia.orden}</span>
                                                    <span className="col-span-2 flex justify-center"><Badge variant="info" size="sm">{materia.codigo}</Badge></span>
                                                    <span className="col-span-3 text-center">
                                                        <button
                                                            onClick={() => setMateriaSeleccionada(materia)}
                                                            className="text-accent-primary hover:text-accent-primary/80 font-medium"
                                                        >
                                                            {materia.nombre}
                                                        </button>
                                                    </span>
                                                    <span className="col-span-2 text-center text-text-subtle text-sm">{materia.creditos}</span>
                                                    <span className="col-span-2 text-center text-text-subtle text-sm">{materia.cargaHoraria}h/sem</span>
                                                    <span className="col-span-2 flex justify-center">
                                                        <StatusBadge estado={materia.estadoUsuario || 'Pendiente'} />
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
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
    carreraNombre={planEstudios?.carrera.nombre || ''}
/>

<Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar inscripción definitivamente" size="md">
    <div className="space-y-4">
        <p>
            ¿Estás seguro de que querés eliminar definitivamente tu inscripción a <strong>{confirmDelete?.carreraNombre}</strong>?
        </p>
        <p className="text-sm text-text-subtle">
            Esto eliminará todo tu progreso académico y planificación asociada a esta carrera. <strong>Esta acción no se puede deshacer.</strong>
        </p>
        <div className="flex justify-end gap-2 pt-4">
            <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="btn-ghost"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn-danger"
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
                className="btn-ghost"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={handleReactivarConfirmed}
                className="btn-warning"
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