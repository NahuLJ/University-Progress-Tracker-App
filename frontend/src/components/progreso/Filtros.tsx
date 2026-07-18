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
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
    );
}