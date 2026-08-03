import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Icon, type IconName } from '../ui/Icon';

interface StatCardProps {
    label: string;
    value: string;
    subtext?: string;
    accentClassName: string;
    iconName: IconName;
}

function StatCard({ label, value, subtext, accentClassName, iconName }: StatCardProps) {
    return (
        <Card className="h-full">
            <div className="flex items-start">
                <div className={`p-2 mt-0.5 rounded-md shrink-0 ${accentClassName}`}>
                    <Icon name={iconName} className="w-6 h-6" />
                </div>
                <div className="ml-4 min-w-0">
                    <h3 className="label">{label}</h3>
                    <p className="text-2xl font-bold text-text-default font-mono leading-none mt-1">
                        {value}
                    </p>
                    {subtext && <p className="label mt-1">{subtext}</p>}
                </div>
            </div>
        </Card>
    );
}

interface PromedioCardProps {
    promedio: number | null;
}

export function PromedioCard({ promedio }: PromedioCardProps) {
    return (
        <StatCard
            label="Promedio General"
            value={promedio ? promedio.toFixed(2) : '—'}
            accentClassName="bg-accent-primary/10 text-accent-primary"
            iconName="chart"
        />
    );
}

interface MateriasAprobadasCardProps {
    aprobadas: number;
    total: number;
}

export function MateriasAprobadasCard({ aprobadas, total }: MateriasAprobadasCardProps) {
    return (
        <StatCard
            label="Materias Aprobadas"
            value={`${aprobadas}/${total}`}
            accentClassName="bg-status-success/15 text-status-success"
            iconName="chart"
        />
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
                    <p className="text-2xl font-bold text-text-default font-mono leading-none mt-1">
                        {obtenidos}/{totales}
                    </p>
                    <div className="mt-1.5 w-full">
                        <ProgressBar value={porcentaje} color="primary" />
                    </div>
                    <p className="label mt-1">{porcentaje}% completados</p>
                </div>
            </div>
        </Card>
    );
}

interface MateriasDisponiblesCardProps {
    cantidad: number;
}

export function MateriasDisponiblesCard({ cantidad }: MateriasDisponiblesCardProps) {
    return (
        <StatCard
            label="Materias Disponibles"
            value={`${cantidad}`}
            subtext="pueden cursarse ahora"
            accentClassName="bg-accent-cyan/15 text-accent-cyan"
            iconName="books"
        />
    );
}

interface ProgresoBarCardProps {
    porcentaje: number;
    materiasRestantes?: number;
}

export function ProgresoBarCard({ porcentaje, materiasRestantes }: ProgresoBarCardProps) {
    return (
        <Card className="h-full">
            <div className="flex items-start">
                <div className="p-2 mt-0.5 bg-accent-primary/10 rounded-md text-accent-primary shrink-0">
                    <Icon name="trending" className="w-6 h-6" />
                </div>
                <div className="ml-4 min-w-0 w-full">
                    <div className="flex items-center justify-between gap-4">
                        <h3 className="label">Progreso General</h3>
                        <p className="label font-mono text-accent-cyan">{porcentaje}%</p>
                    </div>
                    <div className="mt-2 w-full">
                        <ProgressBar value={porcentaje} color="cyan" />
                    </div>
                    {materiasRestantes !== undefined && (
                        <p className="label mt-2">materias restantes: {materiasRestantes}</p>
                    )}
                </div>
            </div>
        </Card>
    );
}
