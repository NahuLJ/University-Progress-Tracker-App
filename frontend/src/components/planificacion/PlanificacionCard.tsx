import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { PeriodoPlanificacion } from '../../types/planificacion.types';

interface PlanificacionCardProps {
    periodo: PeriodoPlanificacion;
    onClick: (periodoId: number) => void;
}

export function PlanificacionCard({ periodo, onClick }: PlanificacionCardProps) {
    const materiasUnicas = [...new Set(
        (periodo.materiasPlanificadas ?? []).map((mp) => mp.materia.nombre),
    )];

    return (
        <Card className="hover:bg-bg-surface-secondary transition-colors h-full">
            <div className="flex flex-col h-full">
                <div className="flex items-start gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text-default truncate">
                            {periodo.nombre || `${periodo.anio} ${periodo.instancia}`}
                        </h3>
                    </div>
                    <Badge variant="info" size="sm" className="shrink-0 text-xs whitespace-nowrap">
                        {periodo.anio} {periodo.instancia}
                    </Badge>
                </div>

                <div className="text-sm text-text-subtle pb-6">
                    <span className="text-text-muted">Materias planificadas:</span>
                    {materiasUnicas.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                            {materiasUnicas.map((nombre) => (
                                <li key={nombre} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0" />
                                    {nombre}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-text-muted mt-1 italic">Sin materias planificadas</p>
                    )}
                </div>

                <div className="mt-auto pt-6 border-t border-hairline flex gap-2">
                    <button
                        type="button"
                        onClick={() => onClick(periodo.periodoId)}
                        className="btn-primary flex-1"
                    >
                        Ver planificación
                    </button>
                </div>
            </div>
        </Card>
    );
}
