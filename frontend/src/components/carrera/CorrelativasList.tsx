import { StatusBadge } from '../ui/StatusBadge';

interface CorrelativasListProps {
    correlativas: any[];
    esCorrelativaDe: any[];
}

export function CorrelativasList({ correlativas, esCorrelativaDe }: CorrelativasListProps) {
    return (
        <div className="space-y-6">
            {correlativas.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold mb-3 text-text-default">Correlativas (para cursar esta materia):</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {correlativas.map((corr: any) => (
                            <li key={corr.correlativaId || corr.materiaCorrelativaId} className="flex flex-col gap-1.5 p-3 bg-bg-surface-secondary rounded-md">
                                <p className="font-medium text-text-default">{corr.materiaCorrelativa?.nombre || corr.nombre}</p>
                                <p className="text-xs text-text-muted">{corr.materiaCorrelativa?.codigo || corr.codigo} • {corr.materiaCorrelativa?.creditos || corr.creditos} créditos</p>
                                <StatusBadge estado={corr.estadoUsuario || 'Pendiente'} className="gap-1 self-start">
                                    {corr.estadoUsuario || 'Pendiente'}
                                </StatusBadge>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {esCorrelativaDe.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold mb-3 text-text-default">Es correlativa de:</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {esCorrelativaDe.map((materia: any) => (
                            <li key={materia.materiaId} className="flex flex-col gap-1.5 p-3 bg-bg-surface-secondary rounded-md">
                                <p className="font-medium text-text-default">{materia.nombre}</p>
                                <p className="text-xs text-text-muted">{materia.codigo} • {materia.creditos} créditos</p>
                                <StatusBadge estado={materia.estadoUsuario || 'Pendiente'} className="gap-1 self-start">
                                    {materia.estadoUsuario || 'Pendiente'}
                                </StatusBadge>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {correlativas.length === 0 && esCorrelativaDe.length === 0 && (
                <div className="text-center py-8 text-text-muted">
                    <p>Esta materia no tiene correlativas registradas.</p>
                </div>
            )}
        </div>
    );
}
