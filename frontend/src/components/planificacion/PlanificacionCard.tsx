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
        <Card className="hover:border-neon-cyan/60 hover:shadow-neon-soft transition-shadow h-full">
            <div className="flex flex-col h-full">
                <div className="flex items-start gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                            {periodo.nombre || `${periodo.anio} ${periodo.instancia}`}
                        </h3>
                    </div>
                    <Badge variant="info" size="sm" className="shrink-0 text-xs whitespace-nowrap">
                        {periodo.anio} {periodo.instancia}
                    </Badge>
                </div>

                <div className="text-sm text-slate-300 pb-6">
                    <span className="text-slate-400">Materias planificadas:</span>
                    {materiasUnicas.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                            {materiasUnicas.map((nombre) => (
                                <li key={nombre} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan shrink-0" />
                                    {nombre}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-500 mt-1 italic">Sin materias planificadas</p>
                    )}
                </div>

                <div className="mt-auto pt-6 border-t flex gap-2">
                    <button
                        type="button"
                        onClick={() => onClick(periodo.periodoId)}
                        className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg border-2 border-neon-cyan/60 text-neon-cyan bg-transparent hover:bg-neon-cyan/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all"
                    >
                        Ver planificación
                    </button>
                </div>
            </div>
        </Card>
    );
}
