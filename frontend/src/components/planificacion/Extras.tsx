import { useMemo } from 'react';
import { Card } from '../ui/Card';
import type { MateriaEnCelda, MateriaDesbloqueable } from '../../types/planificacion.types';

const COLORES = [
    'bg-accent-primary/15 text-accent-primary',
    'bg-status-success/15 text-status-success',
    'bg-status-warning/15 text-status-warning',
    'bg-status-danger/15 text-status-danger',
    'bg-bg-surface-secondary text-text-default',
    'bg-accent-cyan/15 text-accent-cyan',
];

export function LeyendaHorarios({ materias }: { materias: MateriaEnCelda[] }) {
    return (
        <Card>
            <h3 className="text-sm font-semibold mb-3">Leyenda</h3>
            {(!materias || materias.length === 0) ? (
                <p className="text-text-muted text-sm">Añadí materias al cronograma para ver la leyenda</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {materias.reduce((acc: MateriaEnCelda[], m: MateriaEnCelda) => {
                        if (!acc.find((x) => x.materiaId === m.materiaId)) {
                            acc.push(m);
                        }
                        return acc;
                    }, []).map((m: any, i: number) => (
                        <span
                            key={m.materiaId}
                            className={`badge ${COLORES[i % COLORES.length]}`}
                        >
                            {m.nombre} ({m.codigo})
                        </span>
                    ))}
                </div>
            )}
        </Card>
    );
}

export function MateriasDesbloqueablesList({ materias }: { materias: MateriaDesbloqueable[] }) {
    const ordenadas = useMemo(
        () => [...materias].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
        [materias],
    );

    if (ordenadas.length === 0) {
        return (
            <div className="text-center py-8 text-text-muted">
                No hay materias nuevas por desbloquear
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold">Materias que se desbloquearán</h3>
            <p className="text-sm text-text-subtle mb-4">
                Al completar las materias planificadas, también podrás cursar:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {ordenadas.map((m: any) => (
                    <div key={m.materiaId} className="p-3 border border-hairline rounded-md">
                        <div className="font-medium text-text-default">{m.nombre}</div>
                        <div className="text-sm text-text-muted">{m.codigo} • {m.creditos} créditos</div>
                        <div className="text-xs mt-1">
                            {!m.correlativas || m.correlativas.length === 0 ? (
                                <span className="text-text-muted">Sin correlativas</span>
                            ) : (
                                <>
                                    <div className="font-medium text-text-subtle mb-1">Correlativas:</div>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        {m.correlativas.map((c: { nombre: string; estado: string }) => (
                                            <li key={c.nombre} className="text-text-default">
                                                {c.nombre}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}