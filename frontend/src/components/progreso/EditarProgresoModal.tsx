import { useState } from 'react';
import { Button } from '../ui/Button';

interface EditarProgresoModalProps {
    isOpen: boolean;
    onClose: () => void;
    materiaNombre: string;
    estadoActual: string;
    notaActual: number | null;
    tipoActual: string | null;
    onSave: (data: { estado: string; nota?: number; tipoAprobacion?: string }) => void;
    isSaving: boolean;
}

export function EditarProgresoModal({
    isOpen,
    onClose,
    materiaNombre,
    estadoActual,
    notaActual,
    tipoActual,
    onSave,
    isSaving,
}: EditarProgresoModalProps) {
    const [estado, setEstado] = useState(estadoActual);
    const [nota, setNota] = useState(notaActual?.toString() ?? '');
    const [tipoAprobacion, setTipoAprobacion] = useState(tipoActual ?? '');
    const [errorNota, setErrorNota] = useState('');
    const [errorTipo, setErrorTipo] = useState('');

    if (!isOpen) return null;

    const handleGuardar = () => {
        setErrorNota('');
        setErrorTipo('');

        if (estado === 'Completada') {
            let valido = true;

            if (!tipoAprobacion) {
                setErrorTipo('Seleccioná un tipo de aprobación');
                valido = false;
            }

            const notaNum = parseInt(nota);
            const minNota = tipoAprobacion === 'Promocion' ? 7 : 4;
            if (!nota || isNaN(notaNum) || notaNum < minNota || notaNum > 10) {
                setErrorNota(
                    tipoAprobacion === 'Promocion'
                        ? 'Para Promoción la nota mínima es 7'
                        : 'La nota debe ser un número entre 4 y 10'
                );
                valido = false;
            }

            if (!valido) return;

            onSave({ estado, nota: notaNum, tipoAprobacion });
        } else {
            onSave({ estado });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-base-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="card rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-semibold mb-4">Editar progreso</h2>
                <p className="text-slate-300 mb-6">
                    <strong>{materiaNombre}</strong>
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Estado</label>
                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="w-full border border-base-500 bg-base-800/80 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan/60"
                        >
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Completada">Completada</option>
                        </select>
                    </div>

                    {estado === 'Completada' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Nota {tipoAprobacion === 'Promocion' ? '(7-10)' : '(4-10)'}
                                </label>
                                <input
                                    type="number"
                                    min={tipoAprobacion === 'Promocion' ? 7 : 4}
                                    max="10"
                                    value={nota}
                                    onChange={(e) => { setNota(e.target.value); setErrorNota(''); }}
                                    className={`w-full border bg-base-800/80 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan/60 ${
                                        errorNota ? 'border-neon-red' : 'border-base-500'
                                    }`}
                                />
                                {errorNota && <p className="text-sm text-neon-red mt-1">{errorNota}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de aprobación</label>
                                <select
                                    value={tipoAprobacion}
                                    onChange={(e) => { setTipoAprobacion(e.target.value); setErrorTipo(''); }}
                                    className={`w-full border bg-base-800/80 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan/60 ${
                                        errorTipo ? 'border-neon-red' : 'border-base-500'
                                    }`}
                                >
                                    <option value="">Seleccioná tipo</option>
                                    <option value="Final">Final</option>
                                    <option value="Promocion">Promoción</option>
                                </select>
                                {errorTipo && <p className="text-sm text-neon-red mt-1">{errorTipo}</p>}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleGuardar} loading={isSaving}>
                        Guardar
                    </Button>
                </div>
            </div>
        </div>
    );
}
