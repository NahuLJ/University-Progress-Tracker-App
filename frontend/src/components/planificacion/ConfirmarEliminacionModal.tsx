import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { MateriaImpactada } from '../../types/planificacion.types';

interface ConfirmarEliminacionModalProps {
    isOpen: boolean;
    onClose: () => void;
    materiaNombre: string;
    materiaCodigo: string;
    periodoActualNombre: string;
    impactadas: MateriaImpactada[];
    onCascade: () => void;
}

export function ConfirmarEliminacionModal({
    isOpen,
    onClose,
    materiaNombre,
    materiaCodigo,
    periodoActualNombre,
    impactadas,
    onCascade,
}: ConfirmarEliminacionModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Impacto en planes sucesores — ${periodoActualNombre}`} size="lg">
            <div className="space-y-4">
                <p className="text-slate-300">
                    Estás por sacar <strong className="text-white">{materiaCodigo} - {materiaNombre}</strong> del plan actual.
                </p>

                <div className="bg-neon-yellow/10 border border-neon-yellow/30 rounded-lg p-3">
                    <p className="text-sm text-neon-yellow font-medium mb-2">
                        Materias afectadas en planes sucesores:
                    </p>
                    <ul className="space-y-1.5">
                        {impactadas.map((imp) => (
                            <li key={`${imp.materiaId}-${imp.periodoId}`} className="text-sm text-slate-300 flex items-center gap-2">
                                <span className="text-neon-yellow">•</span>
                                <span>
                                    <strong>{imp.codigo} - {imp.nombre}</strong>
                                    <span className="text-slate-500"> en </span>
                                    <span className="text-neon-cyan">{imp.periodoNombre}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="text-sm text-slate-300">
                    Al confirmar se eliminará esta materia del plan actual y todas las materias afectadas de los planes hijos, incluyendo las que dependan indirectamente.
                </p>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose} size="sm">
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => { onCascade(); onClose(); }}
                    >
                        Eliminar en cascada
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
