interface MateriaPlanificadaChipProps {
    materia: any;
    onQuitar: (planificacionId: number) => void;
}

export function MateriaPlanificadaChip({ materia, onQuitar }: MateriaPlanificadaChipProps) {
    return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
            <span>{materia.nombre}</span>
            <span className="text-blue-600">({materia.codigo})</span>
            <button
                onClick={() => onQuitar(materia.planificacionId)}
                className="ml-1 hover:text-blue-600"
                aria-label="Quitar materia"
            >
                ×
            </button>
        </div>
    );
}