import type { UseMutationResult } from '@tanstack/react-query';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import type { CreditosProgreso } from '../../types/creditos.types';

interface Props {
    actividad: CreditosProgreso['actividades'][number];
    marcarCompletada: UseMutationResult<void, Error, number, unknown>;
    desmarcar: UseMutationResult<void, Error, number, unknown>;
}

export function ActividadCreditoRow({ actividad, marcarCompletada, desmarcar }: Props) {
    const conRequisitos = actividad.requisitos.length > 0;
    const requisitosCumplidos = actividad.requisitosCumplidos;
    const puedeCompletar = !conRequisitos || requisitosCumplidos;
    const pendiente = marcarCompletada.isPending || desmarcar.isPending;
    const faltantes = actividad.requisitos.filter((r) => !r.aprobada).map((r) => r.nombre);

    const toggle = () => {
        if (pendiente) return;
        if (actividad.completada) {
            if (actividad.progresoActividadId) {
                desmarcar.mutate(actividad.progresoActividadId);
            }
        } else {
            marcarCompletada.mutate(actividad.actividadCreditoId);
        }
    };

    return (
        <div
            className={cn(
                'flex items-center justify-between gap-3 rounded-md border border-hairline px-3 py-2 transition-colors',
                actividad.completada && 'border-status-success/40 bg-status-success/10',
            )}
        >
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            'text-sm',
                            actividad.completada
                                ? 'text-status-success line-through'
                                : 'text-text-default',
                        )}
                    >
                        {actividad.nombre}
                    </span>
                    <Badge variant="info" size="sm">
                        +{actividad.creditos} cr
                    </Badge>
                </div>
                {conRequisitos && (
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className="text-xs text-text-muted">Requisitos:</span>
                        {actividad.requisitos.map((r) => (
                            <Badge key={r.materiaId} size="sm" variant={r.aprobada ? 'success' : 'danger'}>
                                {r.codigo}
                            </Badge>
                        ))}
                    </div>
                )}
                {conRequisitos && !requisitosCumplidos && (
                    <p className="text-xs text-status-danger mt-1">
                        Completá antes: {faltantes.join(', ')}
                    </p>
                )}
            </div>
            <button
                type="button"
                onClick={toggle}
                disabled={!puedeCompletar || pendiente}
                title={
                    !puedeCompletar
                        ? `Completá antes: ${faltantes.join(', ')}`
                        : actividad.completada
                          ? 'Desmarcar'
                          : 'Marcar completada'
                }
                aria-pressed={actividad.completada}
                className={cn(
                    'shrink-0 w-6 h-6 rounded border transition-colors flex items-center justify-center',
                    actividad.completada
                        ? 'bg-status-success border-status-success text-white'
                        : 'bg-transparent border-hairline text-transparent',
                    !puedeCompletar && 'opacity-40 cursor-not-allowed',
                )}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            </button>
        </div>
    );
}
