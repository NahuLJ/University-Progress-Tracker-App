import React from 'react';
import { usePlanificacionStore } from '../../store/planificacion.store';
import { MateriaPlanificadaChip } from './MateriaPlanificadaChip';
import type { CSSProperties } from 'react';

interface BloqueHorarioCeldaProps {
    bloqueId: number;
    dia: string;
    onDrop: (bloqueId: number, dia: string, materiaId: number) => void;
    style?: CSSProperties;
    ocupado?: boolean;
    isPreview?: boolean;
}

export function BloqueHorarioCelda({ bloqueId, dia, onDrop, style, ocupado, isPreview }: BloqueHorarioCeldaProps) {
    const celdas = usePlanificacionStore((s) => s.celdas);
    const quitarMateria = usePlanificacionStore((s) => s.quitarMateria);

    const key = `${bloqueId}-${dia}`;
    const materia = celdas[key] ?? null;

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        usePlanificacionStore.getState().setHoveredCell({ bloqueId, dia });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        usePlanificacionStore.getState().setHoveredCell(null);
        const draggedId = usePlanificacionStore.getState().draggedMateriaId;
        if (draggedId !== null) {
            onDrop(bloqueId, dia, draggedId);
        }
    };

    const handleQuitar = () => {
        quitarMateria(bloqueId, dia);
    };

    if (ocupado) {
        return (
            <div
                data-bloque={bloqueId}
                data-dia={dia}
                style={style}
                className={`rounded-lg min-h-[48px] border transition-colors ${
                    isPreview ? 'border-neon-cyan bg-neon-cyan/15' : 'bg-base-700/40 border-base-600'
                }`}
            />
        );
    }

    if (materia) {
        return (
            <MateriaPlanificadaChip
                materia={materia}
                onQuitar={handleQuitar}
                style={style}
                bloqueId={bloqueId}
                dia={dia}
                isPreview={isPreview}
            />
        );
    }

    return (
        <div
            data-bloque={bloqueId}
            data-dia={dia}
            style={style}
            className={`min-h-[48px] p-1 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
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