import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { CorrelativasList } from './CorrelativasList';

interface MateriaDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    materia: any;
}

export function MateriaDetailModal({ isOpen, onClose, materia }: MateriaDetailModalProps) {
    if (!materia || !isOpen) return null;

    const estado = materia.estadoUsuario || 'Pendiente';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={materia.nombre} size="lg">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-text-muted">Código: <span className="font-mono font-medium text-text-default">{materia.codigo}</span></p>
                        <p className="text-xs text-text-muted">Créditos: <span className="font-medium text-text-default">{materia.creditos}</span></p>
                        <p className="text-xs text-text-muted">Carga horaria: <span className="font-medium text-text-default">{materia.cargaHoraria}h/semana</span></p>
                    </div>
                    <StatusBadge estado={estado} className="gap-1">
                        {estado}
                        {materia.nota && <span>(Nota: {materia.nota})</span>}
                        {materia.tipoAprobacion && <span>({materia.tipoAprobacion})</span>}
                    </StatusBadge>
                </div>

                <div className="border-t pt-6">
                    <h4 className="text-sm font-semibold mb-3">Descripción</h4>
                    <p className="text-text-subtle whitespace-pre-wrap">{materia.descripcion || 'Sin descripción disponible'}</p>
                </div>

                <div className="border-t pt-6">
                    <CorrelativasList
                        correlativas={materia.correlativas || []}
                        esCorrelativaDe={materia.esCorrelativaDe || []}
                    />
                </div>
            </div>
        </Modal>
    );
}
