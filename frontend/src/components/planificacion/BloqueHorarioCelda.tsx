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
    onBeforeQuitar?: (materia: MateriaEnCelda, bloqueId: number, dia: string) => void;
    idsCompletadas?: Set<number>;
    style?: CSSProperties;
}

export function BloqueHorarioCelda({ bloqueId, dia, materia, onDrop, onMoveDrop, onBeforeQuitar, idsCompletadas, style }: BloqueHorarioCeldaProps) {
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

    const handleBeforeQuitar = (m: MateriaEnCelda) => {
        if (onBeforeQuitar) onBeforeQuitar(m, bloqueId, dia);
    };

    const esCompletada = materia ? idsCompletadas?.has(materia.materiaId) ?? false : false;

    if (materia) {
        return (
            <MateriaPlanificadaChip
                materia={materia}
                onQuitar={handleQuitar}
                onBeforeQuitar={onBeforeQuitar ? handleBeforeQuitar : undefined}
                esCompletada={esCompletada}
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
            className={`h-12 p-1 border-2 border-dashed rounded-md transition-colors cursor-pointer ${
                isPreview ? 'border-accent-primary/40 bg-accent-primary/10' : 'border-hairline hover:border-accent-primary/40'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <div className="h-full flex items-center justify-center text-text-muted text-xs">
                Vacío
            </div>
        </div>
    );
}
