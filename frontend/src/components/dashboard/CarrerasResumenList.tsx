import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';

interface CarrerasResumenListProps {
    carreras: any[];
}

export function CarrerasResumenList({ carreras }: CarrerasResumenListProps) {
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
                {carreras.map((carrera) => (
                    <div key={carrera.usuarioCarreraId} className="flex items-center justify-between p-3 border border-base-600 rounded-lg hover:bg-base-700/50">
                        <div>
                            <h3 className="font-medium">{carrera.carrera.nombre}</h3>
                            <p className="text-sm text-slate-400">
                                Activa desde {new Date(carrera.fechaInicio).toLocaleDateString('es-AR')}
                            </p>
                        </div>
                        <div className="text-right">
                            <Badge variant="success" size="sm" className="mb-1 block">
                                Activa
                            </Badge>
                            <div className="w-48 mt-1">
                                <ProgressBar value={carrera.progresoPorcentaje || 0} />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                {carrera.materiasCompletadas || 0} / {carrera.materiasTotales || 0} materias
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}