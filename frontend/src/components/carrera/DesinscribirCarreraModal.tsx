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
                <p className="text-sm text-slate-300">
                    Vas a desinscribirte de <strong className="text-white">{carreraNombre}</strong>.
                    Tu progreso guardado y fecha de inicio se mantendrán intactos si te reinscribís más adelante.
                </p>
                <div className="flex justify-end gap-2 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => { onSuccess(); onClose(); }}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg border-2 border-neon-red/60 text-neon-red bg-transparent hover:bg-neon-red/10 hover:shadow-[0_0_10px_rgba(248,113,113,0.8)] transition-all"
                    >
                        Desinscribirme
                    </button>
                </div>
            </div>
        </Modal>
    );
}