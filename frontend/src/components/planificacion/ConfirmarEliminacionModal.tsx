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
                <p className="text-text-subtle">
                    Estás por sacar <strong className="text-text-default">{materiaCodigo} - {materiaNombre}</strong> del plan actual.
                </p>

                <div className="bg-status-warning/10 border border-status-warning/30 rounded-md p-3">
                    <p className="text-sm text-status-warning font-medium mb-2">
                        Materias afectadas en planes sucesores:
                    </p>
                    <ul className="space-y-1.5">
                        {impactadas.map((imp) => (
                            <li key={`${imp.materiaId}-${imp.periodoId}`} className="text-sm text-text-subtle flex items-center gap-2">
                                <span className="text-status-warning">•</span>
                                <span>
                                    <strong>{imp.codigo} - {imp.nombre}</strong>
                                    <span className="text-text-muted"> en </span>
                                    <span className="text-accent-primary">{imp.periodoNombre}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="text-sm text-text-subtle">
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
