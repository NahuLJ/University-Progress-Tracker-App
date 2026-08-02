import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { EditarProgresoModal } from './EditarProgresoModal';
import { MateriaDetailModal } from '../carrera/MateriaDetailModal';
import { materiasAdminService } from '../../services/carreras.service';

interface MateriaProgresoRowProps {
    materia: any;
    progreso: any;
    onSave: (id: number, data: any) => void;
    isSaving: boolean;
    carreraId?: number;
    progresoMap?: Record<number, { estado: string; nota: number | null; tipoAprobacion: string | null }>;
}

function chipClass(estado: string) {
    if (estado === 'Completada') {
        return 'badge badge-success';
    }
    if (estado === 'En Proceso') {
        return 'badge badge-warning';
    }
    return 'badge badge-danger';
}

function dotClass(estado: string) {
    if (estado === 'Completada') return 'bg-status-success';
    if (estado === 'En Proceso') return 'bg-status-warning';
    return 'bg-status-danger';
}

export function MateriaProgresoRow({ materia, progreso, onSave, isSaving, carreraId, progresoMap }: MateriaProgresoRowProps) {
    const [modalEdit, setModalEdit] = useState(false);
    const [modalReset, setModalReset] = useState(false);
    const [modalDetalle, setModalDetalle] = useState(false);

    const { data: materiaDetalle } = useQuery({
        queryKey: ['materia-detalle', materia.materiaId, carreraId],
        queryFn: () => materiasAdminService.obtenerMateria(materia.materiaId, carreraId) as Promise<any>,
        enabled: modalDetalle,
        staleTime: Infinity,
    });

    const materiaParaModal = useMemo(() => {
        if (!materiaDetalle) return null;
        const lookupEstado = (materiaId: number) => progresoMap?.[materiaId]?.estado ?? 'Pendiente';
        return {
            ...materiaDetalle,
            estadoUsuario: progreso.estado.nombre,
            nota: progreso.nota,
            tipoAprobacion: progreso.tipoAprobacion,
            correlativas: (materiaDetalle.correlativasRequeridas || []).map((c: any) => ({
                ...c,
                estadoUsuario: lookupEstado(c.materiaCorrelativa?.materiaId ?? c.materiaCorrelativaId),
            })),
            esCorrelativaDe: (materiaDetalle.esCorrelativaDe || []).map((c: any) => ({
                ...c.materia,
                estadoUsuario: lookupEstado(c.materia?.materiaId ?? c.materiaCorrelativaId),
            })),
        };
    }, [materiaDetalle, progreso, progresoMap]);

    const handleSave = (data: { estado: string; nota?: number; tipoAprobacion?: string }) => {
        onSave(progreso.progresoId, data);
    };

    const puedeResetear = progreso.estado.nombre !== 'Pendiente';

    return (
        <div className="grid grid-cols-12 gap-2 items-center p-3 hover:bg-bg-surface-secondary">
            <span className="col-span-1 text-center text-text-muted font-mono text-sm">{progreso.orden}</span>
            <span className="col-span-3 text-center font-medium text-text-default truncate cursor-pointer hover:text-accent-primary transition-colors" title={materia.nombre} onClick={() => setModalDetalle(true)}>{materia.nombre}</span>
            <span className="col-span-2 text-center text-text-muted font-mono text-sm">{materia.codigo}</span>
            <span className="col-span-1 text-center text-text-subtle text-sm">{materia.creditos}</span>

            <div className="col-span-2 flex items-center justify-center">
                <span className={`inline-flex items-center gap-1.5 ${chipClass(progreso.estado.nombre)}`}>
                    <span className={`w-2 h-2 rounded-full ${dotClass(progreso.estado.nombre)}`} />
                    {progreso.estado.nombre}
                </span>
            </div>

            {progreso.estado.nombre === 'Completada' ? (
                <>
                    <span className="col-span-1 text-center text-text-subtle">{progreso.nota ?? '—'}</span>
                    <span className="col-span-1 text-center text-text-muted">{progreso.tipoAprobacion ?? '—'}</span>
                </>
            ) : (
                <div className="col-span-2" />
            )}

            <div className="col-span-1 flex items-center justify-center gap-1">
                <button
                    type="button"
                    onClick={() => setModalEdit(true)}
                    className="p-1.5 rounded-md hover:bg-bg-surface-secondary transition-colors"
                    title="Editar progreso"
                >
                    <Icon name="edit" className="w-4 h-4 text-text-muted hover:text-text-default" />
                </button>
                {puedeResetear && (
                    <button
                        type="button"
                        onClick={() => setModalReset(true)}
                        className="p-1.5 rounded-md hover:bg-status-danger/10 transition-colors"
                        title="Reiniciar progreso"
                    >
                        <Icon name="delete" className="w-4 h-4 text-text-muted hover:text-status-danger" />
                    </button>
                )}
            </div>

            <MateriaDetailModal
                isOpen={modalDetalle}
                onClose={() => setModalDetalle(false)}
                materia={materiaParaModal}
            />

            <EditarProgresoModal
                isOpen={modalEdit}
                onClose={() => setModalEdit(false)}
                materiaNombre={materia.nombre}
                estadoActual={progreso.estado.nombre}
                notaActual={progreso.nota}
                tipoActual={progreso.tipoAprobacion}
                onSave={handleSave}
                isSaving={isSaving}
            />

            {modalReset && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalReset(false)}>
                    <div className="card rounded-card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-sm font-semibold mb-4">Reiniciar progreso</h2>
                        <p className="text-text-subtle mb-6">
                            ¿Reiniciar <strong>{materia.nombre}</strong> a estado Pendiente?
                            {progreso.estado.nombre === 'Completada' && ' Se eliminará la nota y el tipo de aprobación.'}
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setModalReset(false)}>Cancelar</Button>
                            <Button
                                variant="danger"
                                onClick={() => {
                                    handleSave({ estado: 'Pendiente' });
                                    setModalReset(false);
                                }}
                                loading={isSaving}
                            >
                                Confirmar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
