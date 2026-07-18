import { Badge } from '../ui/Badge';

interface CorrelativasListProps {
    correlativas: any[];
    esCorrelativaDe: any[];
}

export function CorrelativasList({ correlativas, esCorrelativaDe }: CorrelativasListProps) {
    return (
        <div className="space-y-6">
            {correlativas.length > 0 && (
                <div>
                    <h4 className="font-medium mb-3 text-white">Correlativas (para cursar esta materia):</h4>
                    <ul className="space-y-2">
                        {correlativas.map((corr: any) => (
                            <li key={corr.correlativaId || corr.materiaCorrelativaId} className="flex items-center justify-between p-3 bg-base-700/60 rounded-lg">
                                <div>
                                    <p className="font-medium text-slate-100">{corr.materiaCorrelativa?.nombre || corr.nombre}</p>
                                    <p className="text-sm text-slate-400">{corr.materiaCorrelativa?.codigo || corr.codigo} • {corr.materiaCorrelativa?.creditos || corr.creditos} créditos</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={
                                        corr.estado === 'Completada' ? 'success' :
                                        corr.estado === 'En Proceso' ? 'warning' : 'danger'
                                    }>
                                        {corr.estado}
                                    </Badge>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {esCorrelativaDe.length > 0 && (
                <div>
                    <h4 className="font-medium mb-3 text-white">Es correlativa de:</h4>
                    <ul className="space-y-2">
                        {esCorrelativaDe.map((materia: any) => (
                            <li key={materia.materiaId} className="flex items-center justify-between p-3 bg-base-700/60 rounded-lg">
                                <div>
                                    <p className="font-medium text-slate-100">{materia.nombre}</p>
                                    <p className="text-sm text-slate-400">{materia.codigo} • {materia.creditos} créditos</p>
                                </div>
                                <Badge variant={
                                    materia.estado === 'Completada' ? 'success' :
                                    materia.estado === 'En Proceso' ? 'warning' : 'danger'
                                }>
                                    {materia.estado}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {correlativas.length === 0 && esCorrelativaDe.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                    <p>Esta materia no tiene correlativas registradas.</p>
                </div>
            )}
        </div>
    );
}