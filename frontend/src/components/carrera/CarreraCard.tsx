import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

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
        ? `${duracionAnios} años (${duracionCuatrimestres} cuatrimestres)`
        : duracionCuatrimestres != null
            ? `${duracionCuatrimestres} cuatrimestres`
            : '—';

    return (
        <Card className="hover:border-neon-cyan/60 hover:shadow-neon-soft transition-shadow">
            <div className="flex justify-between items-start gap-3 mb-3">
                <h3 className="text-lg font-semibold text-white">{carrera.nombre}</h3>
                {inscripto && (
                    <Badge variant="success" size="sm" className="shrink-0 text-xs">
                        Inscripto
                    </Badge>
                )}
                {desinscripto && (
                    <Badge variant="warning" size="sm" className="shrink-0 text-xs">
                        Desinscripto
                    </Badge>
                )}
            </div>

            <p className="text-sm text-slate-300 mb-4 line-clamp-2">{carrera.descripcion}</p>

            <div className="space-y-2 text-sm text-slate-300">
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

            <div className="pt-4 mt-4 border-t flex gap-2">
                <button
                    type="button"
                    onClick={verPlan}
                    className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg border-2 border-neon-cyan/60 text-neon-cyan bg-transparent hover:bg-neon-cyan/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all"
                >
                    Ver plan de estudios
                </button>
            </div>
        </Card>
    );
}
