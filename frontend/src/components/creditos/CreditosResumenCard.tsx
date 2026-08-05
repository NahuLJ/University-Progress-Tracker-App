import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import type { CreditosProgreso } from '../../types/creditos.types';

export function CreditosResumenCard({ data }: { data: CreditosProgreso }) {
    return (
        <Card className="transition-colors hover:bg-bg-surface-secondary">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="label">Créditos obtenidos</p>
                    <p className="text-2xl font-bold text-text-default font-mono leading-none mt-1">
                        {data.creditosObtenidos}/{data.totalRequerido}
                    </p>
                    <p className="label mt-1 text-text-muted">faltan {data.creditosFaltantes}</p>
                </div>
                <div className="w-full max-w-sm">
                    <div className="flex items-center justify-between mb-1">
                        <span className="label">Progreso total</span>
                        <span className="label font-mono text-accent-cyan">{data.progresoPorcentaje}%</span>
                    </div>
                    <ProgressBar value={data.progresoPorcentaje} color="cyan" />
                </div>
                {data.completado ? (
                    <Badge variant="success">¡Sistema de créditos completo!</Badge>
                ) : (
                    <Badge variant="default">En progreso</Badge>
                )}
            </div>
        </Card>
    );
}
