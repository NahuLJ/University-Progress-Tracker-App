import { Modal } from '../ui/Modal';

interface DesinscribirCarreraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    carreraNombre: string;
}

export function DesinscribirCarreraModal({ isOpen, onClose, onSuccess, carreraNombre }: DesinscribirCarreraModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Desinscribirse de ${carreraNombre}`} size="sm">
            <div className="space-y-4">
                <p className="text-sm text-text-subtle">
                    Vas a desinscribirte de <strong className="text-text-default">{carreraNombre}</strong>.
                    Tu progreso guardado y fecha de inicio se mantendrán intactos si te reinscribís más adelante.
                </p>
                <div className="flex justify-end gap-2 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-ghost"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => { onSuccess(); onClose(); }}
                        className="btn-danger"
                    >
                        Desinscribirme
                    </button>
                </div>
            </div>
        </Modal>
    );
}
