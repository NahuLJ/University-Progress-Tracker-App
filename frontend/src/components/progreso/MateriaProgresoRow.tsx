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
}

function chipClass(estado: string) {
    if (estado === 'Completada') {
        return 'bg-neon-green/15 text-neon-green border border-neon-green/30';
    }
    if (estado === 'En Proceso') {
        return 'bg-neon-yellow/15 text-neon-yellow border border-neon-yellow/30';
    }
    return 'bg-neon-red/15 text-neon-red border border-neon-red/30';
}

function dotClass(estado: string) {
    if (estado === 'Completada') return 'bg-neon-green';
    if (estado === 'En Proceso') return 'bg-neon-yellow';
    return 'bg-neon-red';
}

export function MateriaProgresoRow({ materia, progreso, onSave, isSaving, carreraId }: MateriaProgresoRowProps) {
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
        return {
            ...materiaDetalle,
            estadoUsuario: progreso.estado.nombre,
            nota: progreso.nota,
            tipoAprobacion: progreso.tipoAprobacion,
            correlativas: (materiaDetalle.correlativasRequeridas || []).map((c: any) => ({
                ...c,
                estadoUsuario: 'Pendiente',
            })),
            esCorrelativaDe: (materiaDetalle.esCorrelativaDe || []).map((c: any) => ({
                ...c.materia,
                estadoUsuario: 'Pendiente',
            })),
        };
    }, [materiaDetalle, progreso]);

    const handleSave = (data: { estado: string; nota?: number; tipoAprobacion?: string }) => {
        onSave(progreso.progresoId, data);
    };

    const puedeResetear = progreso.estado.nombre !== 'Pendiente';

    return (
        <div className="grid grid-cols-12 gap-2 items-center p-3 hover:bg-base-700/50">
            <span className="col-span-1 text-center text-slate-400 font-mono text-sm">{progreso.orden}</span>
            <span className="col-span-3 text-center font-medium text-slate-100 truncate cursor-pointer hover:text-neon-cyan transition-colors" title={materia.nombre} onClick={() => setModalDetalle(true)}>{materia.nombre}</span>
            <span className="col-span-2 text-center text-slate-400 font-mono text-sm">{materia.codigo}</span>
            <span className="col-span-1 text-center text-slate-300 text-sm">{materia.creditos}</span>

            <div className="col-span-2 flex items-center justify-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${chipClass(progreso.estado.nombre)}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${dotClass(progreso.estado.nombre)}`} />
                    {progreso.estado.nombre}
                </span>
            </div>

            {progreso.estado.nombre === 'Completada' ? (
                <>
                    <span className="col-span-1 text-center text-slate-300">{progreso.nota ?? '—'}</span>
                    <span className="col-span-1 text-center text-slate-400">{progreso.tipoAprobacion ?? '—'}</span>
                </>
            ) : (
                <div className="col-span-2" />
            )}

            <div className="col-span-1 flex items-center justify-center gap-1">
                <button
                    type="button"
                    onClick={() => setModalEdit(true)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title="Editar progreso"
                >
                    <Icon name="edit" className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
                {puedeResetear && (
                    <button
                        type="button"
                        onClick={() => setModalReset(true)}
                        className="p-1.5 rounded-lg hover:bg-neon-red/10 transition-colors"
                        title="Reiniciar progreso"
                    >
                        <Icon name="delete" className="w-4 h-4 text-slate-500 hover:text-neon-red" />
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
                <div className="fixed inset-0 bg-base-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalReset(false)}>
                    <div className="card rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-semibold mb-4">Reiniciar progreso</h2>
                        <p className="text-slate-300 mb-6">
                            ¿Reiniciar <strong>{materia.nombre}</strong> a estado Pendiente?
                            {progreso.estado.nombre === 'Completada' && ' Se eliminará la nota y el tipo de aprobación.'}
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setModalReset(false)}>Cancelar</Button>
                            <Button
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
