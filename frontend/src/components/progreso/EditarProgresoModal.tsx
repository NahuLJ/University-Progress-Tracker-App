import { useState } from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="card rounded-card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-sm font-semibold mb-4">Editar progreso</h2>
                <p className="text-text-subtle mb-6">
                    <strong>{materiaNombre}</strong>
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="label block mb-1">Estado</label>
                        <Select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                        >
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Completada">Completada</option>
                        </Select>
                    </div>

                    {estado === 'Completada' && (
                        <>
                            <div>
                                <label className="label block mb-1">
                                    Nota {tipoAprobacion === 'Promocion' ? '(7-10)' : '(4-10)'}
                                </label>
                                <input
                                    type="number"
                                    min={tipoAprobacion === 'Promocion' ? 7 : 4}
                                    max="10"
                                    value={nota}
                                    onChange={(e) => { setNota(e.target.value); setErrorNota(''); }}
                                    className={`input ${errorNota ? 'input-error' : ''}`}
                                />
                                {errorNota && <p className="text-xs text-status-danger mt-1">{errorNota}</p>}
                            </div>

                            <div>
                                <label className="label block mb-1">Tipo de aprobación</label>
                            <Select
                                value={tipoAprobacion}
                                onChange={(e) => { setTipoAprobacion(e.target.value); setErrorTipo(''); }}
                            >
                                <option value="">Seleccioná tipo</option>
                                <option value="Final">Final</option>
                                <option value="Promocion">Promoción</option>
                            </Select>
                                {errorTipo && <p className="text-xs text-status-danger mt-1">{errorTipo}</p>}
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
