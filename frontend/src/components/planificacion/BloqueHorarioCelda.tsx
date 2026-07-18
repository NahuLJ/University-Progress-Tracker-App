import React from 'react';
import { usePlanificacionStore } from '../../store/planificacion.store';
import { MateriaPlanificadaChip } from './MateriaPlanificadaChip';

interface BloqueHorarioCeldaProps {
    bloqueId: number;
    dia: string;
    onDrop: (bloqueId: number, dia: string, materiaId: number) => void;
}

export function BloqueHorarioCelda({ bloqueId, dia, onDrop }: BloqueHorarioCeldaProps) {
    const celdas = usePlanificacionStore((s) => s.celdas);
    const quitarMateria = usePlanificacionStore((s) => s.quitarMateria);

    const key = `${bloqueId}-${dia}`;
    const materiasEnCelda = celdas[key] || [];
    const [isDraggingOver, setIsDraggingOver] = React.useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = () => {
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const materiaId = e.dataTransfer.getData('materiaId');
        if (materiaId) {
            onDrop(bloqueId, dia, parseInt(materiaId));
        }
    };

    const handleQuitar = (planificacionId: number) => {
        quitarMateria(bloqueId, dia, planificacionId);
    };

    return (
        <div
            className={`min-h-[60px] p-1 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                isDraggingOver ? 'border-neon-cyan bg-neon-cyan/10' : 'border-base-500 hover:border-neon-cyan/60'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {materiasEnCelda.map((materia) => (
                <MateriaPlanificadaChip
                    key={materia.planificacionId}
                    materia={materia}
                    onQuitar={() => handleQuitar(materia.planificacionId)}
                />
            ))}
            {materiasEnCelda.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    Vacío
                </div>
            )}
        </div>
    );
}