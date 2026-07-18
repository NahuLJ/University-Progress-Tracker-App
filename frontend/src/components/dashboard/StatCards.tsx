import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Icon } from '../ui/Icon';

interface PromedioCardProps {
  promedio: number | null;
}

export function PromedioCard({ promedio }: PromedioCardProps) {
  const etiqueta = promedio
    ? promedio >= 8.5 ? 'Excelente'
     : promedio >= 7 ? 'Bueno'
     : promedio >= 6 ? 'Aceptable'
     : 'Bajo'
    : '';

  return (
    <Card className="h-full">
      <div className="flex items-start">
        <div className="p-2 mt-0.5 rounded-lg bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan shrink-0">
          <Icon name="chart" className="w-6 h-6" />
        </div>
        <div className="ml-4 min-w-0">
          <h3 className="text-sm font-medium text-slate-400">Promedio General</h3>
          <p className="text-2xl font-bold text-white leading-none">{promedio?.toFixed(2) || '—'}</p>
          <p className="text-xs text-slate-400 mt-1">{etiqueta || '—'}</p>
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
    <Card className="h-full">
      <div className="flex items-start">
        <div className="p-2 mt-0.5 bg-neon-green/15 rounded-lg text-neon-green shadow-neon-green shrink-0">
          <Icon name="clock" className="w-6 h-6" />
        </div>
        <div className="ml-4 min-w-0">
          <h3 className="text-sm font-medium text-slate-400">Tiempo Estimado</h3>
          <p className="text-2xl font-bold text-white leading-none">
            {cuatrimestres !== null
              ? `${cuatrimestres} cuatrimestre${cuatrimestres === 1 ? '' : 's'}`
              : '—'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {cuatrimestres !== null && cuatrimestres >= 2
              ? `≈ ${Math.floor(cuatrimestres / 2)} años`
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
    <Card className="h-full">
      <div className="flex items-start">
        <div className="p-2 mt-0.5 bg-neon-violet/15 rounded-lg text-neon-violet shadow-neon-violet shrink-0">
          <Icon name="briefcase" className="w-6 h-6" />
        </div>
        <div className="ml-4 min-w-0 w-full">
          <h3 className="text-sm font-medium text-slate-400">Créditos</h3>
          <p className="text-2xl font-bold text-white leading-none">{obtenidos}/{totales}</p>
          <div className="mt-1.5 w-full">
            <ProgressBar value={porcentaje} color="purple" />
          </div>
          <p className="text-xs text-slate-400 mt-1">{porcentaje}% completados</p>
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
    <Card className="h-full">
      <div className="flex items-start">
        <div className="p-2 mt-0.5 bg-neon-orange/15 rounded-lg text-neon-orange shadow-neon-orange shrink-0">
          <Icon name="trending" className="w-6 h-6" />
        </div>
        <div className="ml-4 min-w-0 w-full">
          <h3 className="text-sm font-medium text-slate-400">Progreso General</h3>
          <p className="text-2xl font-bold text-white leading-none">{porcentaje}%</p>
          <div className="mt-1.5 w-full">
            <ProgressBar value={porcentaje} color="orange" />
          </div>
          <p className="text-xs text-slate-400 mt-1">materias completadas</p>
        </div>
      </div>
    </Card>
  );
}
