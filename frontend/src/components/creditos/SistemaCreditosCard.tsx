import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import type { CarreraCreditosConfig } from '../../types/creditos.types';

interface Props {
    config: CarreraCreditosConfig;
    mostrarProgreso: boolean;
}

export function SistemaCreditosCard({ config, mostrarProgreso }: Props) {
    const porcentaje = config.progresoPorcentaje;

    return (
        <Card
            title="Sistema de créditos"
            subtitle="Créditos por actividades exigidos por la carrera"
            className="transition-colors hover:bg-bg-surface-secondary"
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="label">Total requerido</p>
                        <p className="text-2xl font-bold text-text-default font-mono leading-none mt-1">
                            {config.totalCreditos} créditos
                        </p>
                    </div>
                    {mostrarProgreso && (
                        <div className="text-right">
                            <p className="label">Obtenidos</p>
                            <p className="text-2xl font-bold text-text-default font-mono leading-none mt-1">
                                {config.creditosObtenidos}
                                <span className="text-sm text-text-muted">/{config.totalCreditos}</span>
                            </p>
                            <p className="label font-mono text-accent-cyan mt-1">{porcentaje}%</p>
                        </div>
                    )}
                </div>

                {mostrarProgreso && (
                    <ProgressBar value={porcentaje} color="cyan" showLabel />
                )}

                {config.categorias.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {config.categorias.map((c) => (
                            <Badge key={c.carreraCategoriaCreditoId} variant={mostrarProgreso && c.cumplida ? 'success' : 'info'}>
                                {c.nombre}{' '}
                                {mostrarProgreso
                                    ? `${c.obtenidos}/${c.minimoCreditos}`
                                    : `mínimo ${c.minimoCreditos}`}
                            </Badge>
                        ))}
                    </div>
                )}

                {config.actividades.length > 0 && (
                    <div>
                        <p className="label mb-2">Actividades</p>
                        <ul className="space-y-1.5">
                            {config.actividades.map((a) => (
                                <li key={a.carreraActividadCreditoId} className="flex items-center gap-2 text-sm">
                                    <span
                                        className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                                            mostrarProgreso && a.completada
                                                ? 'bg-status-success'
                                                : 'bg-slate-500'
                                        }`}
                                    />
                                    <span className="text-text-default truncate">{a.nombre}</span>
                                    <Badge variant="info" size="sm">
                                        +{a.creditos} cr
                                    </Badge>
                                    {a.materiasRequeridas.length > 0 && (
                                        <span className="flex items-center gap-1 ml-auto shrink-0">
                                            {a.materiasRequeridas.map((m) => (
                                                <Badge key={m.materiaId} size="sm">
                                                    {m.codigo}
                                                </Badge>
                                            ))}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </Card>
    );
}
