import React, { useMemo } from 'react';
import { usePlanificacionStore } from '../../store/planificacion.store';
import { BloqueHorarioCelda } from './BloqueHorarioCelda';
import { MateriaDisponibleList } from './MateriaDisponibleList';
import { horasAsignadas } from '../../types/planificacion.types';

const DIAS = [
    { id: 'Lunes', corto: 'Lun' },
    { id: 'Martes', corto: 'Mar' },
    { id: 'Miércoles', corto: 'Mié' },
    { id: 'Jueves', corto: 'Jue' },
    { id: 'Viernes', corto: 'Vie' },
    { id: 'Sábado', corto: 'Sáb' },
];

const BLOQUES = [
    { id: 1, label: '08-10' },
    { id: 2, label: '10-12' },
    { id: 3, label: '12-14' },
    { id: 4, label: '14-16' },
    { id: 5, label: '16-18' },
    { id: 6, label: '18-20' },
    { id: 7, label: '20-22' },
];

export function CalendarioSemanal() {
    const celdas = usePlanificacionStore((s) => s.celdas);
    const materiasDisponibles = usePlanificacionStore((s) => s.materiasDisponibles);

    const materiasDisponiblesFiltradas = useMemo(() => {
        return materiasDisponibles.filter((m) => horasAsignadas(m.materiaId, celdas) < m.cargaHoraria);
    }, [materiasDisponibles, celdas]);

    const handleDrop = (bloqueId: number, dia: string, materiaId: number) => {
        usePlanificacionStore.getState().asignarMateria(bloqueId, dia, materiaId);
    };

    const handleMoveDrop = (bloqueId: number, dia: string, sourceKey: string) => {
        usePlanificacionStore.getState().moverMateria(sourceKey, bloqueId, dia);
    };

    const handleGridDragLeave = (e: React.DragEvent) => {
        const container = e.currentTarget;
        const related = e.relatedTarget as Node | null;
        if (!related || !container.contains(related)) {
            usePlanificacionStore.getState().setHoveredCell(null);
        }
    };

    const gridItems: React.ReactNode[] = [];

    gridItems.push(
        <div key="header-time" className="font-semibold p-2 text-sm bg-base-700/60 text-slate-200" style={{ gridColumn: 1, gridRow: 1 }}>
            Horario
        </div>,
    );

    DIAS.forEach((dia, i) => {
        gridItems.push(
            <div key={`header-${dia.id}`} className="font-semibold p-2 text-sm text-center bg-base-700/60 text-slate-200" style={{ gridColumn: i + 2, gridRow: 1 }}>
                {dia.corto}
            </div>,
        );
    });

    BLOQUES.forEach((bloque) => {
        gridItems.push(
            <div key={`time-${bloque.id}`} className="px-2 h-12 text-sm text-slate-400 font-medium flex items-center" style={{ gridColumn: 1, gridRow: bloque.id + 1 }}>
                {bloque.label}
            </div>,
        );

        DIAS.forEach((dia, i) => {
            const key = `${bloque.id}-${dia.id}`;
            const materia = celdas[key] ?? null;

            gridItems.push(
                <BloqueHorarioCelda
                    key={key}
                    bloqueId={bloque.id}
                    dia={dia.id}
                    materia={materia}
                    onDrop={handleDrop}
                    onMoveDrop={handleMoveDrop}
                    style={{ gridColumn: i + 2, gridRow: bloque.id + 1 }}
                />,
            );
        });
    });

    return (
        <div className="flex gap-4 items-stretch">
            <div className="w-72 flex-shrink-0">
                <MateriaDisponibleList materias={materiasDisponiblesFiltradas} />
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex-1 overflow-x-auto">
                    <div
                        className="grid grid-cols-[auto_repeat(6,1fr)] gap-1 min-w-[600px]"
                        onDragLeave={handleGridDragLeave}
                        onDrop={handleGridDragLeave}
                    >
                        {gridItems}
                    </div>
                </div>
            </div>
        </div>
    );
}
