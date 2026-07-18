import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface CarreraCardProps {
    carrera: any;
    onClick?: () => void;
    inscripto?: boolean;
    fechaInicio?: string;
    onInscribir?: () => void;
    inscribiendo?: boolean;
    onDesinscribir?: () => void;
    desinscribiendo?: boolean;
}

export function CarreraCard({
    carrera,
    onClick,
    inscripto = false,
    fechaInicio,
    onInscribir,
    inscribiendo = false,
    onDesinscribir,
    desinscribiendo = false,
}: CarreraCardProps) {
    const navigate = useNavigate();

    const verPlan = () => {
        if (onClick) onClick();
        else navigate(`/carreras/${carrera.carreraId}`);
    };

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{carrera.nombre}</h3>
                {inscripto && (
                    <Badge variant="success" className="text-xs">
                        Inscripto
                    </Badge>
                )}
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{carrera.descripcion}</p>

            <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                    <span>Duración:</span>
                    <span className="font-medium">{carrera.duracionEstimadaCuatrimestres} cuatrimestres</span>
                </div>
                <div className="flex justify-between">
                    <span>Créditos:</span>
                    <span className="font-medium">{carrera.creditosTotales}</span>
                </div>
                {fechaInicio && (
                    <div className="flex justify-between">
                        <span>Inicio:</span>
                        <span className="font-medium">{new Date(fechaInicio).toLocaleDateString('es-AR')}</span>
                    </div>
                )}
            </div>

            <div className="pt-4 mt-4 border-t flex gap-2">
                <Button variant="primary" size="sm" className="flex-1" onClick={verPlan}>
                    Ver plan de estudios
                </Button>
                {inscripto ? (
                    onDesinscribir && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            loading={desinscribiendo}
                            onClick={onDesinscribir}
                        >
                            Desinscribirse
                        </Button>
                    )
                ) : (
                    onInscribir && (
                        <Button
                            variant="outline"
                            size="sm"
                            loading={inscribiendo}
                            onClick={onInscribir}
                        >
                            Inscribirse
                        </Button>
                    )
                )}
            </div>
        </Card>
    );
}
