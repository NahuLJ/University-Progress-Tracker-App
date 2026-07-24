import { Icon } from '../ui/Icon';
import type { CSSProperties } from 'react';

interface MateriaPlanificadaChipProps {
    materia: any;
    onQuitar: () => void;
    style?: CSSProperties;
    bloqueId?: number;
    dia?: string;
    isPreview?: boolean;
}

export function MateriaPlanificadaChip({ materia, onQuitar, style, bloqueId, dia, isPreview }: MateriaPlanificadaChipProps) {
    return (
        <div
            data-bloque={bloqueId}
            data-dia={dia}
            style={style}
            className={`flex flex-col justify-center items-center gap-1 p-2 rounded-lg min-h-[48px] cursor-default group border transition-colors ${
                isPreview
                    ? 'bg-neon-cyan/25 text-neon-cyan border-neon-cyan'
                    : 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30'
            }`}
        >
            <span className="text-xs font-semibold leading-tight text-center">{materia.codigo}</span>
            <span className="text-[10px] text-neon-cyan/70 leading-tight text-center">{materia.nombre}</span>
            <button
                onClick={onQuitar}
                className="mt-1 opacity-0 group-hover:opacity-100 hover:text-white transition-all p-0.5 rounded hover:bg-neon-cyan/20"
                aria-label="Quitar materia"
            >
                <Icon name="close" className="w-3 h-3" />
            </button>
        </div>
    );
}