import { useState } from 'react';
import { useDebounce } from '../../utils/debounce';

interface FiltroEstadoProps {
    filtroEstado: string;
    setFiltroEstado: (estado: string) => void;
}

export function FiltroEstado({ filtroEstado, setFiltroEstado }: FiltroEstadoProps) {
    const estados = [
        { value: 'todas', label: 'Todas' },
        { value: 'Pendiente', label: 'Pendientes' },
        { value: 'En Proceso', label: 'En Proceso' },
        { value: 'Completada', label: 'Completadas' },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {estados.map((e) => (
                <button
                    key={e.value}
                    onClick={() => setFiltroEstado(e.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filtroEstado === e.value
                            ? 'bg-neon-cyan text-base-900'
                            : 'bg-base-700/60 text-slate-300 hover:bg-base-600'
                    }`}
                >
                    {e.label}
                </button>
            ))}
        </div>
    );
}

interface FiltroBusquedaProps {
    busqueda: string;
    setBusqueda: (value: string) => void;
}

export function FiltroBusqueda({ busqueda, setBusqueda }: FiltroBusquedaProps) {
    const [valor, setValor] = useState(busqueda);
    const debouncedSetBusqueda = useDebounce<string>(300);

    return (
        <input
            type="text"
            placeholder="Buscar por nombre..."
            value={valor}
            onChange={(e) => {
                setValor(e.target.value);
                debouncedSetBusqueda(setBusqueda, e.target.value);
            }}
            className="w-full sm:w-64 px-3 py-2 bg-base-800/80 border border-base-500 rounded-lg text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan/60"
        />
    );
}