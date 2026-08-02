import { useState, useEffect } from 'react';
import { Accordion } from '../ui/Accordion';
import { Badge } from '../ui/Badge';
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
            className="w-full text-left p-3 hover:bg-bg-surface-secondary rounded-md flex items-center justify-between gap-4 transition-colors"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-text-muted">[{materia.orden}]</span>
                    <span className="font-medium truncate text-text-default">{materia.nombre}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
                    <Badge variant="info" size="sm">{materia.codigo}</Badge>
                    <span>•</span>
                    <span>{materia.cargaHoraria}h/sem</span>
                    <span>•</span>
                    <span>{materia.creditos} créditos</span>
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
    cuatrimestresOpen: Record<string, boolean>;
    onCuatrimestreOpenChange: (key: string, open: boolean) => void;
}

function cuatrimestreKey(anio: number, cuatrimestre: number): string {
    return `${anio}-${cuatrimestre}`;
}

function AnioAccordion({ anio, onMateriaClick, isOpen, onOpenChange, cuatrimestresOpen, onCuatrimestreOpenChange }: AnioAccordionProps) {
    return (
        <Accordion title={`${anio.anio}° Año`} open={isOpen} onOpenChange={onOpenChange}>
            <div className="space-y-2">
                {anio.cuatrimestres.map((cuatrimestre) => (
                    <CuatrimestreAccordion
                        key={cuatrimestreKey(anio.anio, cuatrimestre.cuatrimestre)}
                        cuatrimestre={cuatrimestre}
                        onMateriaClick={onMateriaClick}
                        isOpen={cuatrimestresOpen[cuatrimestreKey(anio.anio, cuatrimestre.cuatrimestre)] ?? false}
                        onOpenChange={(open) => onCuatrimestreOpenChange(cuatrimestreKey(anio.anio, cuatrimestre.cuatrimestre), open)}
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
    const [cuatrimestresOpen, setCuatrimestresOpen] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (expandirSignal > 0) {
            const newAnios: Record<number, boolean> = {};
            const newCuatrimestres: Record<string, boolean> = {};
            planEstudios.anios.forEach((anio) => {
                newAnios[anio.anio] = true;
                anio.cuatrimestres.forEach((cuat) => {
                    newCuatrimestres[cuatrimestreKey(anio.anio, cuat.cuatrimestre)] = true;
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