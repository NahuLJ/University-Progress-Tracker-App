import { Icon } from '../ui/Icon';
import { usePlanificacionStore } from '../../store/planificacion.store';
import type { CSSProperties } from 'react';
import type { MateriaEnCelda } from '../../types/planificacion.types';

interface MateriaPlanificadaChipProps {
    materia: MateriaEnCelda;
    onQuitar: () => void;
    style?: CSSProperties;
    bloqueId?: number;
    dia?: string;
}

export function MateriaPlanificadaChip({ materia, onQuitar, style, bloqueId, dia }: MateriaPlanificadaChipProps) {
    const key = bloqueId !== undefined && dia !== undefined ? `${bloqueId}-${dia}` : undefined;

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', materia.materiaId.toString());
        e.dataTransfer.effectAllowed = 'move';
        usePlanificacionStore.getState().setDraggedMateriaId(materia.materiaId);
        usePlanificacionStore.getState().setDraggedFromKey(key ?? null);
    };

    const handleDragEnd = () => {
        usePlanificacionStore.getState().setDraggedMateriaId(null);
        usePlanificacionStore.getState().setDraggedFromKey(null);
    };

    return (
        <div
            data-bloque={bloqueId}
            data-dia={dia}
            style={style}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`flex flex-col justify-center items-center px-1 py-0.5 rounded-lg h-12 cursor-grab active:cursor-grabbing group border transition-colors bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30 overflow-hidden`}
        >
            <span className="text-xs font-semibold leading-tight text-center truncate w-full">{materia.codigo}</span>
            <span className="text-[10px] text-neon-cyan/70 leading-tight text-center truncate w-full">{materia.nombre}</span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onQuitar();
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-white transition-all p-0.5 rounded hover:bg-neon-cyan/20"
                aria-label="Quitar materia"
            >
                <Icon name="close" className="w-3 h-3" />
            </button>
        </div>
    );
}
