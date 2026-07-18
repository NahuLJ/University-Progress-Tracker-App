import { Icon } from '../ui/Icon';

interface MateriaPlanificadaChipProps {
    materia: any;
    onQuitar: (planificacionId: number) => void;
}

export function MateriaPlanificadaChip({ materia, onQuitar }: MateriaPlanificadaChipProps) {
    return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 rounded text-xs">
            <span>{materia.nombre}</span>
            <span className="text-neon-cyan/80">({materia.codigo})</span>
            <button
                onClick={() => onQuitar(materia.planificacionId)}
                className="ml-1 hover:text-white transition-colors"
                aria-label="Quitar materia"
            >
                <Icon name="close" className="w-3 h-3" />
            </button>
        </div>
    );
}