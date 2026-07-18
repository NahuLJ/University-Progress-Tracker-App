import { Accordion } from '../ui/Accordion';
import { Badge } from '../ui/Badge';
import type { PlanEstudios } from '../../types/carrera.types';

interface MateriaRowProps {
    materia: any;
    onClick: () => void;
}

function MateriaRow({ materia, onClick }: MateriaRowProps) {
    const estado = materia.estadoUsuario?.nombre || 'Pendiente';
    const badgeConfig = {
        Completada: { variant: 'success' as const, emoji: '🟢', label: 'CP' },
        'En Proceso': { variant: 'warning' as const, emoji: '🟡', label: 'EP' },
        Pendiente: { variant: 'danger' as const, emoji: '🔴', label: 'PTE' },
    };
    const config = badgeConfig[estado as keyof typeof badgeConfig] || badgeConfig.Pendiente;

    return (
        <button
            onClick={onClick}
            className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center justify-between gap-4 transition-colors"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-gray-500">[{materia.orden}]</span>
                    <span className="font-medium truncate">{materia.nombre}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span className="font-mono">{materia.codigo}</span>
                    <span>•</span>
                    <span>{materia.creditos} créd.</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant={config.variant} className="gap-1">
                    <span>{config.emoji}</span>
                    <span>{config.label}</span>
                </Badge>
            </div>
        </button>
    );
}

interface CuatrimestreAccordionProps {
    cuatrimestre: { cuatrimestre: number; materias: any[] };
    onMateriaClick: (materia: any) => void;
}

function CuatrimestreAccordion({ cuatrimestre, onMateriaClick }: CuatrimestreAccordionProps) {
    return (
        <Accordion
            title={`${cuatrimestre.cuatrimestre}° Cuatrimestre`}
            defaultOpen={false}
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
}

function AnioAccordion({ anio, onMateriaClick }: AnioAccordionProps) {
    return (
        <Accordion title={`${anio.anio}° Año`} defaultOpen={true}>
            <div className="space-y-2">
                {anio.cuatrimestres.map((cuatrimestre) => (
                    <CuatrimestreAccordion
                        key={cuatrimestre.cuatrimestre}
                        cuatrimestre={cuatrimestre}
                        onMateriaClick={onMateriaClick}
                    />
                ))}
            </div>
        </Accordion>
    );
}

interface PlanEstudiosTreeProps {
    planEstudios: PlanEstudios;
    onMateriaClick?: (materia: any) => void;
}

export function PlanEstudiosTree({ planEstudios, onMateriaClick }: PlanEstudiosTreeProps) {
    return (
        <div className="space-y-4">
            {planEstudios.anios.map((anio) => (
                <AnioAccordion
                    key={anio.anio}
                    anio={anio}
                    onMateriaClick={onMateriaClick || (() => {})}
                />
            ))}
        </div>
    );
}