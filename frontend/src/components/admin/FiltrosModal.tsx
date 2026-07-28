import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface FiltrosState {
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
    incluirInactivos: boolean;
}

interface FiltrosModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FiltrosState) => void;
    sortOptions: { value: string; label: string }[];
    defaultValues?: FiltrosState;
}

export function FiltrosModal({ isOpen, onClose, onApply, sortOptions, defaultValues }: FiltrosModalProps) {
    const [sortBy, setSortBy] = useState(defaultValues?.sortBy ?? 'nombre');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(defaultValues?.sortOrder ?? 'ASC');
    const [incluirInactivos, setIncluirInactivos] = useState(defaultValues?.incluirInactivos ?? false);

    useEffect(() => {
        if (isOpen) {
            setSortBy(defaultValues?.sortBy ?? 'nombre');
            setSortOrder(defaultValues?.sortOrder ?? 'ASC');
            setIncluirInactivos(defaultValues?.incluirInactivos ?? false);
        }
    }, [isOpen, defaultValues]);

    const handleApply = () => {
        onApply({ sortBy, sortOrder, incluirInactivos });
        onClose();
    };

    const handleClear = () => {
        setSortBy('nombre');
        setSortOrder('ASC');
        setIncluirInactivos(false);
        onApply({ sortBy: 'nombre', sortOrder: 'ASC', incluirInactivos: false });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Filtros y ordenamiento" size="sm">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Ordenar por</label>
                    <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                            const [sb, so] = e.target.value.split('-');
                            setSortBy(sb);
                            setSortOrder(so as 'ASC' | 'DESC');
                        }}
                        className="w-full px-3 py-2 bg-base-800/80 border border-base-500 rounded text-slate-100"
                    >
                        {sortOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="incluirInactivos"
                        checked={incluirInactivos}
                        onChange={(e) => setIncluirInactivos(e.target.checked)}
                        className="rounded bg-base-800 border-base-500 text-neon-cyan"
                    />
                    <label htmlFor="incluirInactivos" className="text-sm text-slate-300">
                        Incluir inactivas
                    </label>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={handleClear}>Limpiar</Button>
                    <Button onClick={handleApply}>Aplicar</Button>
                </div>
            </div>
        </Modal>
    );
}