import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatearDuracion } from '../../utils/formato';

interface CarreraCardProps {
    carrera: any;
    onClick?: () => void;
    inscripto?: boolean;
    desinscripto?: boolean;
    fechaInicio?: string;
}

export function CarreraCard({
    carrera,
    onClick,
    inscripto = false,
    desinscripto = false,
    fechaInicio,
}: CarreraCardProps) {
    const navigate = useNavigate();

    const verPlan = () => {
        if (onClick) onClick();
        else navigate(`/carreras/${carrera.carreraId}`);
    };

    const duracionAnios = carrera.duracionAnios;
    const duracionCuatrimestres =
        carrera.duracionEstimadaCuatrimestres ??
        (duracionAnios ? Math.round(duracionAnios * 2) : null);

    const duracionTexto = duracionAnios != null && duracionCuatrimestres != null
        ? `${formatearDuracion(duracionAnios)} años (${duracionCuatrimestres} cuatrimestres)`
        : duracionCuatrimestres != null
            ? `${duracionCuatrimestres} cuatrimestres`
            : '—';

    return (
        <Card className="hover:bg-bg-surface-secondary transition-colors h-full">
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-start gap-4 mb-4">
                    <h3 className="text-sm font-semibold text-text-default">{carrera.nombre}</h3>
                        {inscripto && (
                            <Badge variant="success" size="sm" className="shrink-0 text-xs">
                                Inscripto
                            </Badge>
                        )}
                        {desinscripto && (
                            <Badge variant="warning" size="sm" className="shrink-0 text-xs">
                                Desinscribirse
                            </Badge>
                        )}
                </div>

                <p className="text-sm text-text-subtle line-clamp-3">{carrera.descripcion}</p>

                <div className="mt-6 space-y-3 text-sm text-text-subtle pb-6">
                    <div className="flex justify-between">
                        <span>Duración:</span>
                        <span className="font-medium">{duracionTexto}</span>
                    </div>
                    {fechaInicio && (
                        <div className="flex justify-between">
                            <span>Inicio:</span>
                            <span className="font-medium">{new Date(fechaInicio).toLocaleDateString('es-AR')}</span>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-6 border-t border-hairline flex gap-2">
                    <button
                        type="button"
                        onClick={verPlan}
                        className="btn-primary flex-1"
                    >
                        Ver plan de estudios
                    </button>
                </div>
            </div>
        </Card>
    );
}
