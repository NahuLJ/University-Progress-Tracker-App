import React from 'react';
import { usePlanificacionStore } from '../../store/planificacion.store';
import { MateriaPlanificadaChip } from './MateriaPlanificadaChip';
import type { CSSProperties } from 'react';
import type { MateriaEnCelda } from '../../types/planificacion.types';

interface BloqueHorarioCeldaProps {
    bloqueId: number;
    dia: string;
    materia?: MateriaEnCelda | null;
    onDrop: (bloqueId: number, dia: string, materiaId: number) => void;
    onMoveDrop: (bloqueId: number, dia: string, sourceKey: string) => void;
    style?: CSSProperties;
}

export function BloqueHorarioCelda({ bloqueId, dia, materia, onDrop, onMoveDrop, style }: BloqueHorarioCeldaProps) {
    const draggedMateriaId = usePlanificacionStore((s) => s.draggedMateriaId);
    const hoveredCell = usePlanificacionStore((s) => s.hoveredCell);
    const isPreview = hoveredCell?.bloqueId === bloqueId && hoveredCell?.dia === dia && draggedMateriaId !== null;

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        usePlanificacionStore.getState().setHoveredCell({ bloqueId, dia });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        usePlanificacionStore.getState().setHoveredCell(null);
        const state = usePlanificacionStore.getState();
        const draggedFromKey = state.draggedFromKey;
        const destKey = `${bloqueId}-${dia}`;
        if (draggedFromKey !== null && draggedFromKey !== destKey && state.celdas[draggedFromKey]) {
            onMoveDrop(bloqueId, dia, draggedFromKey);
            return;
        }
        usePlanificacionStore.getState().setDraggedFromKey(null);
        const draggedId = state.draggedMateriaId;
        if (draggedId !== null) {
            onDrop(bloqueId, dia, draggedId);
        }
    };

    const handleQuitar = () => {
        usePlanificacionStore.getState().quitarMateria(bloqueId, dia);
    };

    if (materia) {
        return (
            <MateriaPlanificadaChip
                materia={materia}
                onQuitar={handleQuitar}
                style={{ ...style, gridColumn: undefined, gridRow: undefined }}
                bloqueId={bloqueId}
                dia={dia}
            />
        );
    }

    return (
        <div
            data-bloque={bloqueId}
            data-dia={dia}
            style={style}
            className={`h-12 p-1 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                isPreview ? 'border-neon-cyan bg-neon-cyan/10' : 'border-base-500 hover:border-neon-cyan/60'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Vacío
            </div>
        </div>
    );
}
