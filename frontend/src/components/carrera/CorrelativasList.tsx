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
                    <ul className="space-y-2">
                        {correlativas.map((corr: any) => (
                            <li key={corr.correlativaId || corr.materiaCorrelativaId} className="flex items-center justify-between p-3 bg-bg-surface-secondary rounded-md">
                                <div>
                                    <p className="font-medium text-text-default">{corr.materiaCorrelativa?.nombre || corr.nombre}</p>
                                    <p className="text-xs text-text-muted">{corr.materiaCorrelativa?.codigo || corr.codigo} • {corr.materiaCorrelativa?.creditos || corr.creditos} créditos</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge estado={corr.estadoUsuario || 'Pendiente'} className="gap-1">
                                        {corr.estadoUsuario || 'Pendiente'}
                                        {corr.nota && <span>(Nota: {corr.nota})</span>}
                                        {corr.tipoAprobacion && <span>({corr.tipoAprobacion})</span>}
                                    </StatusBadge>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {esCorrelativaDe.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold mb-3 text-text-default">Es correlativa de:</h4>
                    <ul className="space-y-2">
                        {esCorrelativaDe.map((materia: any) => (
                            <li key={materia.materiaId} className="flex items-center justify-between p-3 bg-bg-surface-secondary rounded-md">
                                <div>
                                    <p className="font-medium text-text-default">{materia.nombre}</p>
                                    <p className="text-xs text-text-muted">{materia.codigo} • {materia.creditos} créditos</p>
                                </div>
                                <StatusBadge estado={materia.estadoUsuario || 'Pendiente'} className="gap-1">
                                    {materia.estadoUsuario || 'Pendiente'}
                                    {materia.nota && <span>(Nota: {materia.nota})</span>}
                                    {materia.tipoAprobacion && <span>({materia.tipoAprobacion})</span>}
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
