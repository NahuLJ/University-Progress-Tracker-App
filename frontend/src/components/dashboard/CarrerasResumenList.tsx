import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { cn } from '../../utils/cn';

interface CarrerasResumenListProps {
    carreras: any[];
    usuarioCarreraIdActivo?: number | null;
    onSeleccionar?: (usuarioCarreraId: number) => void;
}

export function CarrerasResumenList({ carreras, usuarioCarreraIdActivo, onSeleccionar }: CarrerasResumenListProps) {
    if (!carreras || carreras.length === 0) {
        return (
            <Card>
                <p className="text-slate-400 text-center py-4">No tenés carreras activas</p>
            </Card>
        );
    }

    return (
        <Card>
            <div className="space-y-3">
                {carreras.map((carrera) => {
                    const activa = carrera.usuarioCarreraId === usuarioCarreraIdActivo;
                    return (
                        <div
                            key={carrera.usuarioCarreraId}
                            className={cn(
                                'flex items-center justify-between p-3 border rounded-lg transition-all',
                                onSeleccionar ? 'cursor-pointer hover:border-neon-cyan/60 hover:shadow-neon-cyan' : 'border-base-600',
                                activa
                                    ? 'border-neon-cyan/70 shadow-neon-cyan/20 shadow-sm'
                                    : 'border-base-600',
                            )}
                            onClick={onSeleccionar ? () => onSeleccionar(carrera.usuarioCarreraId) : undefined}
                        >
                            <div className="min-w-0">
                                <h3 className="font-medium truncate">{carrera.carrera.nombre}</h3>
                                <p className="text-sm text-slate-400">
                                    {carrera.activo ? 'Carrera activa' : 'Inactiva'}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <Badge variant={carrera.activo ? 'success' : 'default'} size="sm" className="mb-1">
                                    {carrera.activo ? 'Activa' : 'Inactiva'}
                                </Badge>
                                <div className="w-48 mt-1">
                                    <ProgressBar value={carrera.progresoPorcentaje || 0} />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    {carrera.materiasCompletadas || 0} / {carrera.materiasTotales || 0} materias
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
