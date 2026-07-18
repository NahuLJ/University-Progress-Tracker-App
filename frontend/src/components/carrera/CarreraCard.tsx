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
        <Card className="hover:shadow-neon-cyan transition-shadow">
            <div className="flex justify-between items-start gap-3 mb-3">
                <h3 className="text-lg font-semibold text-white">{carrera.nombre}</h3>
                {inscripto && (
                    <Badge variant="success" size="sm" className="shrink-0 text-xs">
                        Inscripto
                    </Badge>
                )}
            </div>

            <p className="text-sm text-slate-300 mb-4 line-clamp-2">{carrera.descripcion}</p>

            <div className="space-y-2 text-sm text-slate-300">
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
                            className="text-neon-red hover:text-red-400"
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
