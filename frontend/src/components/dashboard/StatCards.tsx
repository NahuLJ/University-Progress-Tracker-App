import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';

interface PromedioCardProps {
    promedio: number | null;
    materiasConNota: number;
}

export function PromedioCard({ promedio, materiasConNota }: PromedioCardProps) {
    const color = promedio
        ? promedio >= 8.5 ? 'bg-blue-100 text-blue-800'
          : promedio >= 7 ? 'bg-green-100 text-green-800'
          : promedio >= 6 ? 'bg-yellow-100 text-yellow-800'
          : 'bg-orange-100 text-orange-800'
        : 'bg-gray-100 text-gray-500';

    const etiqueta = promedio
        ? promedio >= 8.5 ? 'Excelente'
          : promedio >= 7 ? 'Bueno'
          : promedio >= 6 ? 'Aceptable'
          : 'Bajo'
        : 'Sin datos';

    return (
        <Card>
            <div className="flex items-center">
                <div className="p-2 rounded-lg text-2xl">📊</div>
                <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Promedio General</h3>
                    <p className="text-2xl font-bold text-gray-900">{promedio?.toFixed(2) || '—'}</p>
                    <p className="text-xs text-gray-500">de {materiasConNota} materias</p>
                    <Badge variant="default" className={color} size="sm">{etiqueta}</Badge>
                </div>
            </div>
        </Card>
    );
}

interface TiempoRestanteCardProps {
    cuatrimestres: number | null;
}

export function TiempoRestanteCard({ cuatrimestres }: TiempoRestanteCardProps) {
    return (
        <Card>
            <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Tiempo Estimado</h3>
                    <p className="text-2xl font-bold text-gray-900">
                        {cuatrimestres !== null ? cuatrimestres : '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                        {cuatrimestres !== null
                            ? cuatrimestres >= 2
                                ? `≈ ${Math.floor(cuatrimestres / 2)} años`
                                : `${cuatrimestres} cuatrimestre${cuatrimestres > 1 ? 's' : ''}`
                            : '—'}
                    </p>
                </div>
            </div>
        </Card>
    );
}

interface CreditosCardProps {
    obtenidos: number;
    totales: number;
}

export function CreditosCard({ obtenidos, totales }: CreditosCardProps) {
    const porcentaje = totales > 0 ? Math.round((obtenidos / totales) * 100) : 0;

    return (
        <Card>
            <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-2xl">💼</span>
                </div>
                <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Créditos</h3>
                    <p className="text-2xl font-bold text-gray-900">{obtenidos}/{totales}</p>
                    <div className="mt-1 w-32">
                        <ProgressBar value={porcentaje} color="purple" />
                    </div>
                    <p className="text-xs text-gray-500">{porcentaje}% completados</p>
                </div>
            </div>
        </Card>
    );
}

interface ProgresoBarCardProps {
    porcentaje: number;
}

export function ProgresoBarCard({ porcentaje }: ProgresoBarCardProps) {
    return (
        <Card>
            <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                    <span className="text-2xl">📈</span>
                </div>
                <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Progreso General</h3>
                    <p className="text-2xl font-bold text-gray-900">{porcentaje}%</p>
                    <div className="mt-1 w-32">
                        <ProgressBar value={porcentaje} color="orange" />
                    </div>
                    <p className="text-xs text-gray-500">materias completadas</p>
                </div>
            </div>
        </Card>
    );
}