import type { UseMutationResult } from '@tanstack/react-query';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { ActividadCreditoRow } from './ActividadCreditoRow';
import type { CreditosProgreso } from '../../types/creditos.types';

interface Props {
    categoria: CreditosProgreso['categorias'][number];
    actividades: CreditosProgreso['actividades'];
    marcarCompletada: UseMutationResult<void, Error, number, unknown>;
    desmarcar: UseMutationResult<void, Error, number, unknown>;
}

export function CategoriaCreditosCard({ categoria, actividades, marcarCompletada, desmarcar }: Props) {
    const porcentaje = categoria.minimo > 0 ? (categoria.obtenidos / categoria.minimo) * 100 : 0;

    return (
        <Card className="transition-colors hover:bg-bg-surface-secondary">
            <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-text-default">{categoria.nombre}</h3>
                {categoria.cumplida ? (
                    <Badge variant="success">Cumplida</Badge>
                ) : (
                    <Badge variant="default">
                        {categoria.obtenidos}/{categoria.minimo}
                    </Badge>
                )}
            </div>
            <ProgressBar value={porcentaje} color={categoria.cumplida ? 'success' : 'primary'} className="mb-2" />
            <p className="label mb-3 text-text-muted">
                mínimo {categoria.minimo} — obtenidos {categoria.obtenidos}
            </p>
            {actividades.length === 0 ? (
                <p className="text-sm text-text-muted">Sin actividades en esta categoría.</p>
            ) : (
                <div className="space-y-2">
                    {actividades.map((a) => (
                        <ActividadCreditoRow
                            key={a.actividadCreditoId}
                            actividad={a}
                            marcarCompletada={marcarCompletada}
                            desmarcar={desmarcar}
                        />
                    ))}
                </div>
            )}
        </Card>
    );
}
