import { useState } from 'react';
import { Button } from '../ui/Button';

interface CompletarMateriaModalProps {
    isOpen: boolean;
    onClose: () => void;
    materiaNombre: string;
    onConfirm: (nota: number, tipoAprobacion: string) => void;
}

export function CompletarMateriaModal({ isOpen, onClose, materiaNombre, onConfirm }: CompletarMateriaModalProps) {
    const [nota, setNota] = useState('');
    const [tipoAprobacion, setTipoAprobacion] = useState('');

    const handleConfirm = () => {
        if (!nota || !tipoAprobacion) return;
        onConfirm(parseInt(nota), tipoAprobacion);
        onClose();
        setNota('');
        setTipoAprobacion('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-semibold mb-4">Completar materia</h2>
                <p className="text-gray-600 mb-4">Estás por marcar como completada: <strong>{materiaNombre}</strong></p>
                <p className="text-sm text-gray-500 mb-6">Para confirmar, completá los datos:</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nota (4-10)</label>
                        <input
                            type="number"
                            min="4"
                            max="10"
                            value={nota}
                            onChange={(e) => setNota(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de aprobación</label>
                        <select
                            value={tipoAprobacion}
                            onChange={(e) => setTipoAprobacion(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Seleccioná tipo</option>
                            <option value="Final">Final</option>
                            <option value="Promocion">Promoción</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={!nota || !tipoAprobacion}>
                        Confirmar y guardar
                    </Button>
                </div>
            </div>
        </div>
    );
}