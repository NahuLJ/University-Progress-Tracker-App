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
                                onSeleccionar ? 'cursor-pointer hover:bg-bg-surface-secondary transition-colors' : '',
                                activa ? 'bg-accent-primary/10 border-accent-primary/40' : '',
                            )}
                            onClick={onSeleccionar ? () => onSeleccionar(c.usuarioCarreraId) : undefined}
                        >
                            <h3 className="text-sm font-semibold text-text-default truncate">{c.carrera.nombre}</h3>
                            <Badge variant={c.activo ? 'success' : 'default'}>
                                {c.activo ? 'Activa' : 'Inactiva'}
                            </Badge>

                        <div className="mt-3">
                            <div className="flex justify-between text-sm text-text-muted mb-1">
                                <span>Progreso</span>
                                <span>{c.progresoPorcentaje}%</span>
                            </div>
                            <ProgressBar value={c.progresoPorcentaje} color={activa ? 'success' : 'primary'} />
                        </div>

                        <div className="mt-3 flex justify-between text-sm text-text-muted">
                            <span>
                                {c.materiasCompletadas}/{c.materiasTotales} materias
                            </span>
                            <span>
                                Promedio:{' '}
                                <span className="font-medium text-text-default">
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
