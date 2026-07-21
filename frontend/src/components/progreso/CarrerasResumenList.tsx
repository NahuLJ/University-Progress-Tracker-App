import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import type { CarreraResumen } from '../../types/estadisticas.types';

interface CarrerasResumenListProps {
    carreras: CarreraResumen[];
    usuarioCarreraIdActivo?: number | null;
    onSeleccionar?: (usuarioCarreraId: number) => void;
}

export function CarrerasResumenList({
    carreras,
    usuarioCarreraIdActivo,
    onSeleccionar,
}: CarrerasResumenListProps) {
    if (carreras.length === 0) return null;

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {carreras.map((c) => {
                const activa = c.usuarioCarreraId === usuarioCarreraIdActivo;
                return (
                        <Card
                            key={c.usuarioCarreraId}
                            className={cn(
                                onSeleccionar ? 'cursor-pointer hover:shadow-neon-cyan transition-shadow' : '',
                                activa ? 'border-neon-cyan/70 shadow-neon-cyan/20 shadow-sm' : '',
                            )}
                            onClick={onSeleccionar ? () => onSeleccionar(c.usuarioCarreraId) : undefined}
                        >
                            <h3 className="font-semibold text-white truncate">{c.carrera.nombre}</h3>
                            <Badge variant={c.activo ? 'success' : 'default'}>
                                {c.activo ? 'Activa' : 'Inactiva'}
                            </Badge>

                        <div className="mt-3">
                            <div className="flex justify-between text-sm text-slate-300 mb-1">
                                <span>Progreso</span>
                                <span>{c.progresoPorcentaje}%</span>
                            </div>
                            <ProgressBar value={c.progresoPorcentaje} color={activa ? 'green' : 'blue'} />
                        </div>

                        <div className="mt-3 flex justify-between text-sm text-slate-300">
                            <span>
                                {c.materiasCompletadas}/{c.materiasTotales} materias
                            </span>
                            <span>
                                Promedio:{' '}
                                <span className="font-medium text-white">
                                    {c.promedioGeneral !== null ? c.promedioGeneral.toFixed(2) : '—'}
                                </span>
                            </span>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
