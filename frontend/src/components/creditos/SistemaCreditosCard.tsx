import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import type { CarreraCreditosConfig } from '../../types/creditos.types';

interface Props {
    config: CarreraCreditosConfig;
}

export function SistemaCreditosCard({ config }: Props) {
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
                    <div className="text-right">
                        <p className="label">Obtenidos</p>
                        <p className="text-2xl font-bold text-text-default font-mono leading-none mt-1">
                            {config.creditosObtenidos}
                            <span className="text-sm text-text-muted">/{config.totalCreditos}</span>
                        </p>
                        <p className="label font-mono text-accent-cyan mt-1">{porcentaje}%</p>
                    </div>
                </div>

                <ProgressBar value={porcentaje} color="cyan" showLabel />

                {config.categorias.length > 0 && (
                    <div>
                        <p className="label mb-2">Progreso por categoría</p>
                        <div className="space-y-3">
                            {config.categorias.map((c) => {
                                const pct = c.minimoCreditos > 0 ? (c.obtenidos / c.minimoCreditos) * 100 : 0;
                                return (
                                    <div key={c.carreraCategoriaCreditoId}>
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="text-sm text-text-default">{c.nombre}</span>
                                            <span className="flex items-center gap-2 text-sm font-mono text-text-subtle">
                                                {c.obtenidos}/{c.minimoCreditos} créditos
                                                {c.cumplida && <Badge variant="success" size="sm">Cumplida</Badge>}
                                            </span>
                                        </div>
                                        <ProgressBar value={pct} color={c.cumplida ? 'success' : 'primary'} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
