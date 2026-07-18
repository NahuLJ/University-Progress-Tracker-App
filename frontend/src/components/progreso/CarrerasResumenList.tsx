import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
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
                        className={onSeleccionar ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
                        onClick={onSeleccionar ? () => onSeleccionar(c.usuarioCarreraId) : undefined}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-900 truncate">{c.carrera.nombre}</h3>
                            {c.activo && <Badge variant="success">Activa</Badge>}
                        </div>

                        <div className="mt-3">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progreso</span>
                                <span>{c.progresoPorcentaje}%</span>
                            </div>
                            <ProgressBar value={c.progresoPorcentaje} color={activa ? 'green' : 'blue'} />
                        </div>

                        <div className="mt-3 flex justify-between text-sm text-gray-600">
                            <span>
                                {c.materiasCompletadas}/{c.materiasTotales} materias
                            </span>
                            <span>
                                Promedio:{' '}
                                <span className="font-medium text-gray-900">
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
