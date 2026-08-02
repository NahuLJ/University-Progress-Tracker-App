import { Icon } from '../ui/Icon';
import { usePlanificacionStore } from '../../store/planificacion.store';
import type { CSSProperties } from 'react';
import type { MateriaEnCelda } from '../../types/planificacion.types';

interface MateriaPlanificadaChipProps {
    materia: MateriaEnCelda;
    onQuitar: () => void;
    onBeforeQuitar?: (materia: MateriaEnCelda, bloqueId: number, dia: string) => void;
    esCompletada?: boolean;
    style?: CSSProperties;
    bloqueId?: number;
    dia?: string;
}

export function MateriaPlanificadaChip({ materia, onQuitar, onBeforeQuitar, esCompletada, style, bloqueId, dia }: MateriaPlanificadaChipProps) {
    const key = bloqueId !== undefined && dia !== undefined ? `${bloqueId}-${dia}` : undefined;

    const handleDragStart = (e: React.DragEvent) => {
        if (esCompletada) { e.preventDefault(); return; }
        e.dataTransfer.setData('text/plain', materia.materiaId.toString());
        e.dataTransfer.effectAllowed = 'move';
        usePlanificacionStore.getState().setDraggedMateriaId(materia.materiaId);
        usePlanificacionStore.getState().setDraggedFromKey(key ?? null);
    };

    const handleDragEnd = () => {
        usePlanificacionStore.getState().setDraggedMateriaId(null);
        usePlanificacionStore.getState().setDraggedFromKey(null);
    };

    const handleQuitarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (esCompletada) return;
        if (onBeforeQuitar && bloqueId !== undefined && dia !== undefined) {
            onBeforeQuitar(materia, bloqueId, dia);
        } else {
            onQuitar();
        }
    };

    return (
        <div
            data-bloque={bloqueId}
            data-dia={dia}
            style={style}
            draggable={!esCompletada}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`flex flex-col justify-center items-center px-1 py-0.5 rounded-md h-12 group border transition-colors overflow-hidden ${
                esCompletada
                    ? 'bg-status-success/15 text-status-success border-status-success/30 cursor-default opacity-70'
                    : 'bg-accent-primary/15 text-accent-primary border-accent-primary/30 cursor-grab active:cursor-grabbing'
            }`}
        >
            <span className="text-xs font-semibold leading-tight text-center truncate w-full">{materia.codigo}</span>
            <span className="text-[10px] leading-tight text-center truncate w-full">{materia.nombre}</span>
            {esCompletada ? (
                <span className="text-[10px] text-status-success/70 leading-tight">Completada</span>
            ) : (
                <button
                    onClick={handleQuitarClick}
                    className="opacity-0 group-hover:opacity-100 hover:text-text-default transition-all p-0.5 rounded hover:bg-accent-primary/20"
                    aria-label="Quitar materia"
                >
                    <Icon name="close" className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}
