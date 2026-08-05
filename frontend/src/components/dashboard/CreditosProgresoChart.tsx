import { Card } from '../ui/Card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import type { CSSProperties } from 'react';
import { ChartTooltip } from './ChartTooltip';
import { useTooltipPosition, type TooltipPosition } from '../../hooks/useTooltipPosition';
import type { CreditosProgreso } from '../../types/creditos.types';

const AXIS_TICK = {
    fill: '#64748b',
    fontSize: 12,
    fontFamily: 'JetBrains Mono, monospace',
} as const;

const BAR_ACTIVE_STYLE = { stroke: '#0a0c12', strokeWidth: 2 };

function tooltipContent(pos: TooltipPosition | null) {
    return (props: any) => <ChartTooltip {...props} x={pos?.x} y={pos?.y} />;
}

function tooltipWrapperStyle(pos: TooltipPosition | null): CSSProperties | undefined {
    return pos
        ? { position: 'fixed', left: 0, top: 0, transform: 'none', pointerEvents: 'none' }
        : undefined;
}

export function CreditosProgresoChart({ data }: { data: CreditosProgreso | undefined }) {
    const { pos, onMouseMove, onMouseLeave } = useTooltipPosition();

    if (!data?.sistemaCreditos || data.categorias.length === 0) {
        return (
            <Card
                title="Créditos por actividades"
                subtitle="Progreso por categoría del sistema de créditos"
                className="transition-colors hover:bg-bg-surface-secondary"
            >
                <div className="h-[220px] flex items-center justify-center text-text-muted">
                    {data?.sistemaCreditos
                        ? 'Sin categorías configuradas'
                        : 'Esta carrera no tiene sistema de créditos'}
                </div>
            </Card>
        );
    }

    const chartData = data.categorias.map((c) => ({
        nombre: c.nombre.length > 14 ? `${c.nombre.slice(0, 14)}…` : c.nombre,
        obtenidos: c.obtenidos,
        minimo: c.minimo,
        cumplida: c.cumplida,
    }));

    const categoriaTick = ({ x, y, payload }: any) => (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={12}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
            >
                {payload.value}
            </text>
        </g>
    );

    return (
        <Card
            title="Créditos por actividades"
            subtitle="Progreso por categoría del sistema de créditos"
            className="transition-colors hover:bg-bg-surface-secondary"
        >
            <div className="animate-fade-in" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                        data={chartData}
                        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                    >
                        <CartesianGrid stroke="rgba(148,163,184,0.09)" vertical={false} />
                        <XAxis
                            dataKey="nombre"
                            tick={categoriaTick}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            height={32}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={AXIS_TICK}
                            axisLine={false}
                            tickLine={false}
                            width={32}
                        />
                        <Tooltip
                            content={tooltipContent(pos)}
                            wrapperStyle={tooltipWrapperStyle(pos)}
                            cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                        />
                        <Bar
                            dataKey="obtenidos"
                            name="Obtenidos"
                            activeBar={BAR_ACTIVE_STYLE}
                            radius={[3, 3, 0, 0]}
                            isAnimationActive
                            animationBegin={0}
                            animationDuration={900}
                            animationEasing="ease-out"
                        >
                            {chartData.map((c) => (
                                <Cell key={c.nombre} fill={c.cumplida ? '#10b981' : '#22d3ee'} />
                            ))}
                        </Bar>
                        <Bar
                            dataKey="minimo"
                            name="Mínimo"
                            fill="rgba(148,163,184,0.25)"
                            radius={[3, 3, 0, 0]}
                            isAnimationActive
                            animationBegin={0}
                            animationDuration={900}
                            animationEasing="ease-out"
                        />
                    </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-6 mt-2 label">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-[#22d3ee] inline-block" />
                        Obtenidos
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-[#94a3b8]/30 inline-block" />
                        Mínimo
                    </span>
                    <span>
                        Total:{' '}
                        <span className="text-accent-cyan font-mono">
                            {data.creditosObtenidos}/{data.totalRequerido}
                        </span>
                    </span>
                </div>
            </div>
        </Card>
    );
}
