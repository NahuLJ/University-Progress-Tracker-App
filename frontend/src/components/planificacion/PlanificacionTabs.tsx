import { Button } from '../ui/Button';

interface PlanificacionTabsProps {
    periodos: any[];
    periodoActivo: any;
    onSelect: (periodoId: number) => void;
    onNuevo: () => void;
}

export function PlanificacionTabs({ periodos, periodoActivo, onSelect, onNuevo }: PlanificacionTabsProps) {
    return (
        <div className="flex flex-wrap gap-2 mb-4">
            {periodos.map((periodo) => (
                <Button
                    key={periodo.periodoId}
                    variant={periodoActivo?.periodoId === periodo.periodoId ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => onSelect(periodo.periodoId)}
                >
                    {periodo.anio} {periodo.instancia}
                    {periodo.nombre && ` - ${periodo.nombre}`}
                </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={onNuevo}>
                + Nueva
            </Button>
        </div>
    );
}