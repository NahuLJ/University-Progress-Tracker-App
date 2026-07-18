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

    const estado = materia.estadoUsuario?.nombre || 'Pendiente';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={materia.nombre} size="lg">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-400">Código: <span className="font-mono font-medium text-white">{materia.codigo}</span></p>
                        <p className="text-sm text-slate-400">Créditos: <span className="font-medium text-white">{materia.creditos}</span></p>
                        <p className="text-sm text-slate-400">Carga horaria: <span className="font-medium text-white">{materia.cargaHoraria} horas</span></p>
                    </div>
                    <StatusBadge estado={estado} className="gap-1">
                        {materia.nota && <span>(Nota: {materia.nota})</span>}
                        {materia.tipoAprobacion && <span>({materia.tipoAprobacion})</span>}
                    </StatusBadge>
                </div>

                <div className="border-t pt-6">
                    <h4 className="font-medium mb-3">Descripción</h4>
                    <p className="text-slate-300 whitespace-pre-wrap">{materia.descripcion || 'Sin descripción disponible'}</p>
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