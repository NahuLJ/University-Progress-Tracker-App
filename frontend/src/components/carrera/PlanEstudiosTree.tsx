import { useState, useEffect } from 'react';
import { Accordion } from '../ui/Accordion';
import { StatusBadge } from '../ui/StatusBadge';
import type { PlanEstudios } from '../../types/carrera.types';

interface MateriaRowProps {
    materia: any;
    onClick: () => void;
}

function MateriaRow({ materia, onClick }: MateriaRowProps) {
    const estado = materia.estadoUsuario || 'Pendiente';

    return (
        <button
            onClick={onClick}
            className="w-full text-left p-3 hover:bg-base-700/50 rounded-lg flex items-center justify-between gap-4 transition-colors"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-slate-400">[{materia.orden}]</span>
                    <span className="font-medium truncate text-slate-100">{materia.nombre}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="font-mono">{materia.codigo}</span>
                    <span>•</span>
                    <span>{materia.creditos} créd.</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <StatusBadge estado={estado} />
            </div>
        </button>
    );
}

interface CuatrimestreAccordionProps {
    cuatrimestre: { cuatrimestre: number; materias: any[] };
    onMateriaClick: (materia: any) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

function CuatrimestreAccordion({ cuatrimestre, onMateriaClick, isOpen, onOpenChange }: CuatrimestreAccordionProps) {
    return (
        <Accordion
            title={`${cuatrimestre.cuatrimestre}° Cuatrimestre`}
            open={isOpen}
            onOpenChange={onOpenChange}
        >
            <div className="space-y-1 pl-4">
                {cuatrimestre.materias.map((materia: any) => (
                    <MateriaRow
                        key={materia.materiaId}
                        materia={materia}
                        onClick={() => onMateriaClick(materia)}
                    />
                ))}
            </div>
        </Accordion>
    );
}

interface AnioAccordionProps {
    anio: { anio: number; cuatrimestres: { cuatrimestre: number; materias: any[] }[] };
    onMateriaClick: (materia: any) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    cuatrimestresOpen: Record<number, boolean>;
    onCuatrimestreOpenChange: (cuatrimestre: number, open: boolean) => void;
}

function AnioAccordion({ anio, onMateriaClick, isOpen, onOpenChange, cuatrimestresOpen, onCuatrimestreOpenChange }: AnioAccordionProps) {
    return (
        <Accordion title={`${anio.anio}° Año`} open={isOpen} onOpenChange={onOpenChange}>
            <div className="space-y-2">
                {anio.cuatrimestres.map((cuatrimestre) => (
                    <CuatrimestreAccordion
                        key={cuatrimestre.cuatrimestre}
                        cuatrimestre={cuatrimestre}
                        onMateriaClick={onMateriaClick}
                        isOpen={cuatrimestresOpen[cuatrimestre.cuatrimestre] ?? false}
                        onOpenChange={(open) => onCuatrimestreOpenChange(cuatrimestre.cuatrimestre, open)}
                    />
                ))}
            </div>
        </Accordion>
    );
}

interface PlanEstudiosTreeProps {
    planEstudios: PlanEstudios;
    onMateriaClick?: (materia: any) => void;
    expandirSignal?: number;
    contraerSignal?: number;
}

export function PlanEstudiosTree({ planEstudios, onMateriaClick, expandirSignal = 0, contraerSignal = 0 }: PlanEstudiosTreeProps) {
    const [aniosOpen, setAniosOpen] = useState<Record<number, boolean>>({});
    const [cuatrimestresOpen, setCuatrimestresOpen] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (expandirSignal > 0) {
            const newAnios: Record<number, boolean> = {};
            const newCuatrimestres: Record<number, boolean> = {};
            planEstudios.anios.forEach((anio) => {
                newAnios[anio.anio] = true;
                anio.cuatrimestres.forEach((cuat) => {
                    newCuatrimestres[cuat.cuatrimestre] = true;
                });
            });
            setAniosOpen(newAnios);
            setCuatrimestresOpen(newCuatrimestres);
        }
    }, [expandirSignal, planEstudios]);

    useEffect(() => {
        if (contraerSignal > 0) {
            setAniosOpen({});
            setCuatrimestresOpen({});
        }
    }, [contraerSignal]);

    return (
        <div className="space-y-4">
            {planEstudios.anios.map((anio) => (
                <AnioAccordion
                    key={anio.anio}
                    anio={anio}
                    onMateriaClick={onMateriaClick || (() => {})}
                    isOpen={aniosOpen[anio.anio] ?? true}
                    onOpenChange={(open) => setAniosOpen((prev) => ({ ...prev, [anio.anio]: open }))}
                    cuatrimestresOpen={cuatrimestresOpen}
                    onCuatrimestreOpenChange={(cuatrimestre, open) =>
                        setCuatrimestresOpen((prev) => ({ ...prev, [cuatrimestre]: open }))
                    }
                />
            ))}
        </div>
    );
}