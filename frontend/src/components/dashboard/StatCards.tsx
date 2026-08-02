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
        <div className="p-2 mt-0.5 rounded-md bg-accent-primary/10 text-accent-primary shrink-0">
          <Icon name="chart" className="w-6 h-6" />
        </div>
        <div className="ml-4 min-w-0">
          <h3 className="label">Promedio General</h3>
          <p className="text-2xl font-bold text-text-default font-mono leading-none mt-1">{promedio?.toFixed(2) || '—'}</p>
          <p className="label mt-1">{etiqueta || '—'}</p>
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
        <div className="p-2 mt-0.5 bg-status-success/15 rounded-md text-status-success shrink-0">
          <Icon name="clock" className="w-6 h-6" />
        </div>
        <div className="ml-4 min-w-0">
          <h3 className="label">Tiempo Estimado</h3>
          <p className="text-2xl font-bold text-text-default leading-none mt-1">
            {cuatrimestres !== null
              ? `${cuatrimestres} cuatrimestre${cuatrimestres === 1 ? '' : 's'}`
              : '—'}
          </p>
          <p className="label mt-1">
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
        <div className="p-2 mt-0.5 bg-accent-primary/10 rounded-md text-accent-primary shrink-0">
          <Icon name="briefcase" className="w-6 h-6" />
        </div>
        <div className="ml-4 min-w-0 w-full">
          <h3 className="label">Créditos</h3>
          <p className="text-2xl font-bold text-text-default font-mono leading-none mt-1">{obtenidos}/{totales}</p>
          <div className="mt-1.5 w-full">
            <ProgressBar value={porcentaje} color="primary" />
          </div>
          <p className="label mt-1">{porcentaje}% completados</p>
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
        <div className="p-2 mt-0.5 bg-accent-primary/10 rounded-md text-accent-primary shrink-0">
          <Icon name="trending" className="w-6 h-6" />
        </div>
        <div className="ml-4 min-w-0 w-full">
          <h3 className="label">Progreso General</h3>
          <p className="text-2xl font-bold text-text-default font-mono leading-none mt-1">{porcentaje}%</p>
          <div className="mt-1.5 w-full">
            <ProgressBar value={porcentaje} color="primary" />
          </div>
          <p className="label mt-1">materias completadas</p>
        </div>
      </div>
    </Card>
  );
}
