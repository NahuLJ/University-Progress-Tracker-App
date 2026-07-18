import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { CorrelativasList } from './CorrelativasList';

interface MateriaDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    materia: any;
}

export function MateriaDetailModal({ isOpen, onClose, materia }: MateriaDetailModalProps) {
    if (!materia || !isOpen) return null;

    const estado = materia.estadoUsuario?.nombre || 'Pendiente';
    const badgeConfig = {
        Completada: { variant: 'success' as const, emoji: '🟢', label: 'Completada' },
        'En Proceso': { variant: 'warning' as const, emoji: '🟡', label: 'En Proceso' },
        Pendiente: { variant: 'danger' as const, emoji: '🔴', label: 'Pendiente' },
    };
    const config = badgeConfig[estado as keyof typeof badgeConfig] || badgeConfig.Pendiente;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={materia.nombre} size="lg">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Código: <span className="font-mono font-medium text-gray-900">{materia.codigo}</span></p>
                        <p className="text-sm text-gray-500">Créditos: <span className="font-medium text-gray-900">{materia.creditos}</span></p>
                        <p className="text-sm text-gray-500">Carga horaria: <span className="font-medium text-gray-900">{materia.cargaHoraria} horas</span></p>
                    </div>
                    <Badge variant={config.variant} className="gap-1">
                        <span>{config.emoji}</span>
                        <span>{config.label}</span>
                        {materia.nota && <span>(Nota: {materia.nota})</span>}
                        {materia.tipoAprobacion && <span>({materia.tipoAprobacion})</span>}
                    </Badge>
                </div>

                <div className="border-t pt-6">
                    <h4 className="font-medium mb-3">Descripción</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{materia.descripcion || 'Sin descripción disponible'}</p>
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