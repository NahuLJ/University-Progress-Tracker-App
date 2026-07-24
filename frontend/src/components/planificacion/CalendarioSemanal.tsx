import React, { useMemo, useState, useEffect } from 'react';
import { usePlanificacionStore } from '../../store/planificacion.store';
import { BloqueHorarioCelda } from './BloqueHorarioCelda';
import { MateriaDisponibleList } from './MateriaDisponibleList';
import { LeyendaHorarios } from './Extras';
import { MateriaPlanificadaChip } from './MateriaPlanificadaChip';
import { bloquesRequeridos, MAX_BLOQUE_ID } from '../../types/planificacion.types';
import type { MateriaEnCelda } from '../../types/planificacion.types';

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

function getOccupiedCells(celdas: Record<string, MateriaEnCelda | null>): Set<string> {
    const occupied = new Set<string>();
    for (const [key, materia] of Object.entries(celdas)) {
        if (!materia) continue;
        const [bloqueIdStr, dia] = key.split('-');
        const bloqueId = parseInt(bloqueIdStr);
        const span = bloquesRequeridos(materia.cargaHoraria);
        for (let i = 0; i < span; i++) {
            occupied.add(`${bloqueId + i}-${dia}`);
        }
    }
    return occupied;
}

export function CalendarioSemanal() {
    const celdas = usePlanificacionStore((s) => s.celdas);
    const materiasDisponibles = usePlanificacionStore((s) => s.materiasDisponibles);
    const asignarMateria = usePlanificacionStore((s) => s.asignarMateria);

    const [previewCells, setPreviewCells] = useState<string[]>([]);

    const draggedMateriaId = usePlanificacionStore((s) => s.draggedMateriaId);
    const hoveredCell = usePlanificacionStore((s) => s.hoveredCell);

    const idsPlanificados = useMemo(() => {
        const ids = new Set<number>();
        for (const materia of Object.values(celdas)) {
            if (materia) ids.add(materia.materiaId);
        }
        return ids;
    }, [celdas]);

    const materiasDisponiblesFiltradas = useMemo(() => {
        return materiasDisponibles.filter((m) => !idsPlanificados.has(m.materiaId));
    }, [materiasDisponibles, idsPlanificados]);

    useEffect(() => {
        if (draggedMateriaId === null || hoveredCell === null) {
            setPreviewCells([]);
            return;
        }
        const materia = materiasDisponiblesFiltradas.find((m) => m.materiaId === draggedMateriaId);
        if (!materia) {
            setPreviewCells([]);
            return;
        }
        const span = bloquesRequeridos(materia.cargaHoraria);
        const cells: string[] = [];
        for (let i = 0; i < span && hoveredCell.bloqueId + i <= MAX_BLOQUE_ID; i++) {
            cells.push(`${hoveredCell.bloqueId + i}-${hoveredCell.dia}`);
        }
        setPreviewCells(cells);
    }, [draggedMateriaId, hoveredCell, materiasDisponiblesFiltradas]);

    const materiasEnCalendario = useMemo(() => {
        return Object.values(celdas).filter((m): m is MateriaEnCelda => m !== null);
    }, [celdas]);

    const occupiedCells = useMemo(() => getOccupiedCells(celdas), [celdas]);

    const spanStarts = useMemo(() => {
        const starts = new Set<string>();
        for (const [key, materia] of Object.entries(celdas)) {
            if (materia) starts.add(key);
        }
        return starts;
    }, [celdas]);

    const handleDrop = (bloqueId: number, dia: string, materiaId: number) => {
        asignarMateria(bloqueId, dia, materiaId);
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

    const previewSet = useMemo(() => new Set(previewCells), [previewCells]);

    BLOQUES.forEach((bloque) => {
        gridItems.push(
            <div key={`time-${bloque.id}`} className="p-2 text-sm text-slate-400 font-medium" style={{ gridColumn: 1, gridRow: bloque.id + 1 }}>
                {bloque.label}
            </div>,
        );

        DIAS.forEach((dia, i) => {
            const key = `${bloque.id}-${dia.id}`;
            const materia = celdas[key] ?? null;
            const isSpanStart = spanStarts.has(key) && materia !== null;
            const isInSpan = occupiedCells.has(key) && !isSpanStart;
            const inPreview = previewSet.has(key);

            if (isSpanStart && materia) {
                const span = bloquesRequeridos(materia.cargaHoraria);
                gridItems.push(
                    <MateriaPlanificadaChip
                        key={key}
                        materia={materia}
                        onQuitar={() => {
                            const store = usePlanificacionStore.getState();
                            store.quitarMateria(bloque.id, dia.id);
                        }}
                        style={{ gridColumn: i + 2, gridRow: `${bloque.id + 1} / span ${span}` }}
                        bloqueId={bloque.id}
                        dia={dia.id}
                        isPreview={inPreview}
                    />,
                );
            } else if (isInSpan && inPreview) {
                gridItems.push(
                    <BloqueHorarioCelda
                        key={key}
                        bloqueId={bloque.id}
                        dia={dia.id}
                        onDrop={handleDrop}
                        style={{ gridColumn: i + 2, gridRow: bloque.id + 1 }}
                        ocupado
                        isPreview
                    />,
                );
            } else if (!isInSpan) {
                gridItems.push(
                    <BloqueHorarioCelda
                        key={key}
                        bloqueId={bloque.id}
                        dia={dia.id}
                        onDrop={handleDrop}
                        style={{ gridColumn: i + 2, gridRow: bloque.id + 1 }}
                        isPreview={inPreview}
                    />,
                );
            }
        });
    });

    return (
        <div className="flex gap-4 items-stretch">
            <div className="w-72 flex-shrink-0">
                <MateriaDisponibleList materias={materiasDisponiblesFiltradas} />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-3">
                <LeyendaHorarios materias={materiasEnCalendario} />
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