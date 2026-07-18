import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Icon } from '../ui/Icon';

interface PromedioCardProps {
    promedio: number | null;
    materiasConNota: number;
}

export function PromedioCard({ promedio, materiasConNota }: PromedioCardProps) {
    const color = promedio
        ? promedio >= 8.5 ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
          : promedio >= 7 ? 'bg-neon-green/15 text-neon-green border border-neon-green/30'
          : promedio >= 6 ? 'bg-neon-yellow/15 text-neon-yellow border border-neon-yellow/30'
          : 'bg-neon-orange/15 text-neon-orange border border-neon-orange/30'
        : 'bg-slate-700/40 text-slate-400 border border-slate-600/50';

    const etiqueta = promedio
        ? promedio >= 8.5 ? 'Excelente'
          : promedio >= 7 ? 'Bueno'
          : promedio >= 6 ? 'Aceptable'
          : 'Bajo'
        : 'Sin datos';

    return (
        <Card>
            <div className="flex items-center">
                <div className="p-2 rounded-lg bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan">
                    <Icon name="chart" className="w-6 h-6" />
                </div>
                <div className="ml-4">
                    <h3 className="text-sm font-medium text-slate-400">Promedio General</h3>
                    <p className="text-2xl font-bold text-white">{promedio?.toFixed(2) || '—'}</p>
                    <p className="text-xs text-slate-400">de {materiasConNota} materias</p>
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
                <div className="p-2 bg-neon-green/15 rounded-lg text-neon-green shadow-neon-green">
                    <Icon name="clock" className="w-6 h-6" />
                </div>
                <div className="ml-4">
                    <h3 className="text-sm font-medium text-slate-400">Tiempo Estimado</h3>
                    <p className="text-2xl font-bold text-white">
                        {cuatrimestres !== null ? cuatrimestres : '—'}
                    </p>
                    <p className="text-xs text-slate-400">
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
                <div className="p-2 bg-neon-violet/15 rounded-lg text-neon-violet shadow-neon-violet">
                    <Icon name="briefcase" className="w-6 h-6" />
                </div>
                <div className="ml-4">
                    <h3 className="text-sm font-medium text-slate-400">Créditos</h3>
                    <p className="text-2xl font-bold text-white">{obtenidos}/{totales}</p>
                    <div className="mt-1 w-32">
                        <ProgressBar value={porcentaje} color="purple" />
                    </div>
                    <p className="text-xs text-slate-400">{porcentaje}% completados</p>
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
                <div className="p-2 bg-neon-orange/15 rounded-lg text-neon-orange shadow-neon-orange">
                    <Icon name="trending" className="w-6 h-6" />
                </div>
                <div className="ml-4">
                    <h3 className="text-sm font-medium text-slate-400">Progreso General</h3>
                    <p className="text-2xl font-bold text-white">{porcentaje}%</p>
                    <div className="mt-1 w-32">
                        <ProgressBar value={porcentaje} color="orange" />
                    </div>
                    <p className="text-xs text-slate-400">materias completadas</p>
                </div>
            </div>
        </Card>
    );
}