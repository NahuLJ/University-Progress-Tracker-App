import { Card } from '../ui/Card';
import {
    PieChart,
    Pie,
    Cell,
    Sector,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import type { CSSProperties } from 'react';
import { ChartTooltip } from './ChartTooltip';
import { useTooltipPosition, type TooltipPosition } from '../../hooks/useTooltipPosition';
import { usePieTooltip } from '../../hooks/usePieTooltip';
import type {
    NotasDistribucion,
    ProgresoPorAnio,
} from '../../types/estadisticas.types';

type EstadoMateria = 'Completada' | 'En Proceso' | 'Pendiente';

const COLORES: Record<EstadoMateria, string> = {
    Completada: '#10b981', // status-success
    'En Proceso': '#f59e0b', // status-warning
    Pendiente: '#ef4444', // status-danger
};

const AXIS_TICK = {
    fill: '#64748b',
    fontSize: 10,
    fontFamily: 'JetBrains Mono, monospace',
} as const;

const BAR_ACTIVE_STYLE = { stroke: '#0a0c12', strokeWidth: 2 };

const COLORES_NOTA: Record<string, string> = {
    '4-5': '#64748b',
    '6': '#8b5cf6',
    '7': '#3b82f6',
    '8': '#22d3ee',
    '9': '#34d399',
    '10': '#10b981',
};

function tooltipContent(pos: TooltipPosition | null) {
    return (props: any) => <ChartTooltip {...props} x={pos?.x} y={pos?.y} />;
}

function tooltipWrapperStyle(pos: TooltipPosition | null): CSSProperties | undefined {
    return pos
        ? { position: 'fixed', left: 0, top: 0, transform: 'none', pointerEvents: 'none' }
        : undefined;
}

function ChartEmpty({ message }: { message: string }) {
    return (
        <div className="h-[200px] flex items-center justify-center text-text-muted">
            {message}
        </div>
    );
}

function ActivePieSlice(props: any) {
    const {
        cx,
        cy,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        fill,
    } = props;

    return (
        <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius + 3}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            stroke="#0a0c12"
            strokeWidth={2}
        />
    );
}

export function MateriasPorEstadoChart({
    data,
}: {
    data: Array<{ estado: EstadoMateria; cantidad: number }>;
}) {
    const { containerRef, hovered, onMouseMove, onMouseLeave } = usePieTooltip(data, 44, 72);

    if (!data || data.length === 0) {
        return (
            <Card title="Distribución de materias" subtitle="Materias según su estado de avance">
                <ChartEmpty message="Sin datos de distribución" />
            </Card>
        );
    }

    const total = data.reduce((s, d) => s + d.cantidad, 0);

    return (
        <Card
            title="Distribución de materias"
            subtitle="Materias según su estado de avance"
            className="transition-colors hover:bg-bg-surface-secondary"
        >
            <div
                className="animate-fade-in"
                ref={containerRef}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
            >
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="cantidad"
                            nameKey="estado"
                            innerRadius={44}
                            outerRadius={72}
                            paddingAngle={2}
                            stroke="#0a0c12"
                            activeShape={<ActivePieSlice />}
                            isAnimationActive
                            animationBegin={0}
                            animationDuration={1200}
                            animationEasing="ease-out"
                        >
                            {data.map((d) => (
                                <Cell key={d.estado} fill={COLORES[d.estado]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                {hovered && data[hovered.index] && (
                    <ChartTooltip
                        active
                        x={hovered.pos.x}
                        y={hovered.pos.y}
                        payload={[
                            {
                                name: data[hovered.index].estado,
                                value: data[hovered.index].cantidad,
                                color: COLORES[data[hovered.index].estado],
                            },
                        ]}
                    />
                )}
            </div>
            <div className="flex justify-center gap-4 mt-2">
                {data.map((d) => (
                    <div key={d.estado} className="flex items-center gap-1.5">
                        <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ background: COLORES[d.estado] }}
                        />
                        <span className="label">{d.estado}</span>
                        <span className="label font-mono">
                            {d.cantidad} ({total > 0 ? Math.round((d.cantidad / total) * 100) : 0}%)
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

export function NotasDistribucionChart({
    data,
}: {
    data: NotasDistribucion | undefined;
}) {
    const { pos, onMouseMove, onMouseLeave } = useTooltipPosition();

    return (
        <Card title="Distribución de notas" subtitle="Notas de materias aprobadas" className="transition-colors hover:bg-bg-surface-secondary">
            {!data || data.rangos.length === 0 || data.materiasConNota === 0 ? (
                <ChartEmpty message="Sin notas registradas" />
            ) : (
                <div className="animate-fade-in" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.rangos} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid stroke="rgba(148,163,184,0.09)" vertical={false} />
                            <XAxis dataKey="rango" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
                            <Tooltip
                                content={tooltipContent(pos)}
                                wrapperStyle={tooltipWrapperStyle(pos)}
                                cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                            />
                            <Bar
                                dataKey="cantidad"
                                name="Materias"
                                activeBar={BAR_ACTIVE_STYLE}
                                radius={[4, 4, 0, 0]}
                                isAnimationActive
                                animationBegin={0}
                                animationDuration={900}
                                animationEasing="ease-out"
                            >
                                {data.rangos.map((r) => (
                                    <Cell
                                        key={r.rango}
                                        fill={COLORES_NOTA[r.rango] ?? '#22d3ee'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-6 mt-2 label">
                        <span>
                            Promedio general:{' '}
                            <span className="text-accent-cyan font-mono">
                                {data.promedioGeneral.toFixed(2)}
                            </span>
                        </span>
                        <span>
                            Materias con nota:{' '}
                            <span className="text-accent-cyan font-mono">
                                {data.materiasConNota}
                            </span>
                        </span>
                    </div>
                </div>
            )}
        </Card>
    );
}

export function ProgresoPorAnioChart({ data }: { data: ProgresoPorAnio[] }) {
    const { pos, onMouseMove, onMouseLeave } = useTooltipPosition();

    const anioTick = ({ x, y, payload }: any) => {
        const totalDelAnio = data.find((d) => d.anio === payload.value);
        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={14}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize={10}
                    fontFamily="JetBrains Mono, monospace"
                >
                    {payload.value}
                </text>
                {totalDelAnio && (
                    <text
                        x={0}
                        y={0}
                        dy={29}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize={9}
                        fontFamily="JetBrains Mono, monospace"
                    >
                        {totalDelAnio.completadas + totalDelAnio.enProceso + totalDelAnio.pendientes} materias
                    </text>
                )}
            </g>
        );
    };

    return (
        <Card title="Progreso por año" subtitle="Materias por año del plan" className="transition-colors hover:bg-bg-surface-secondary">
            {!data || data.length === 0 ? (
                <ChartEmpty message="Sin datos de progreso por año" />
            ) : (
                <div className="animate-fade-in" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid stroke="rgba(148,163,184,0.09)" vertical={false} />
                            <XAxis
                                dataKey="anio"
                                tick={anioTick}
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                                height={44}
                            />
                            <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
                            <Tooltip
                                content={tooltipContent(pos)}
                                wrapperStyle={tooltipWrapperStyle(pos)}
                                cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                            />
                            <Bar
                                dataKey="completadas"
                                name="Completadas"
                                fill="#10b981"
                                activeBar={BAR_ACTIVE_STYLE}
                                radius={[3, 3, 0, 0]}
                                isAnimationActive
                                animationBegin={0}
                                animationDuration={900}
                                animationEasing="ease-out"
                            />
                            <Bar
                                dataKey="enProceso"
                                name="En proceso"
                                fill="#f59e0b"
                                activeBar={BAR_ACTIVE_STYLE}
                                radius={[3, 3, 0, 0]}
                                isAnimationActive
                                animationBegin={0}
                                animationDuration={900}
                                animationEasing="ease-out"
                            />
                            <Bar
                                dataKey="pendientes"
                                name="Pendientes"
                                fill="#ef4444"
                                activeBar={BAR_ACTIVE_STYLE}
                                radius={[3, 3, 0, 0]}
                                isAnimationActive
                                animationBegin={0}
                                animationDuration={900}
                                animationEasing="ease-out"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    );
}

export function EstadisticasSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="h-8 w-64 bg-bg-surface-secondary rounded animate-pulse" />
                <div className="h-3 w-80 bg-bg-surface-secondary rounded animate-pulse" />
                <div className="h-3 w-40 bg-bg-surface-secondary rounded animate-pulse" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="h-full">
                        <div className="flex items-start">
                            <div className="h-10 w-10 bg-bg-surface-secondary rounded-md animate-pulse shrink-0" />
                            <div className="ml-4 space-y-2 w-full">
                                <div className="h-3 w-24 bg-bg-surface-secondary rounded animate-pulse" />
                                <div className="h-6 w-16 bg-bg-surface-secondary rounded animate-pulse" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="h-full">
                <div className="flex items-start">
                    <div className="h-10 w-10 bg-bg-surface-secondary rounded-md animate-pulse shrink-0" />
                    <div className="ml-4 w-full space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="h-3 w-32 bg-bg-surface-secondary rounded animate-pulse" />
                            <div className="h-3 w-8 bg-bg-surface-secondary rounded animate-pulse" />
                        </div>
                        <div className="h-2 w-full bg-bg-surface-secondary rounded-full animate-pulse" />
                        <div className="h-3 w-40 bg-bg-surface-secondary rounded animate-pulse" />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <div className="space-y-2 mb-3">
                            <div className="h-3 w-40 bg-bg-surface-secondary rounded animate-pulse" />
                            <div className="h-3 w-56 bg-bg-surface-secondary rounded animate-pulse" />
                        </div>
                        <div className="h-64 bg-bg-surface-secondary rounded animate-pulse" />
                    </Card>
                ))}
            </div>

            <Card>
                <div className="space-y-2 mb-3">
                    <div className="h-3 w-32 bg-bg-surface-secondary rounded animate-pulse" />
                    <div className="h-3 w-48 bg-bg-surface-secondary rounded animate-pulse" />
                </div>
                <div className="h-56 bg-bg-surface-secondary rounded animate-pulse" />
            </Card>

            <div>
                <div className="h-4 w-32 bg-bg-surface-secondary rounded animate-pulse mb-3" />
                <Card>
                    <div className="space-y-3">
                        {[...Array(2)].map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3 rounded-md border border-hairline"
                            >
                                <div className="h-4 w-48 bg-bg-surface-secondary rounded animate-pulse" />
                                <div className="w-48 space-y-2">
                                    <div className="h-3 w-20 bg-bg-surface-secondary rounded animate-pulse ml-auto" />
                                    <div className="h-1.5 w-full bg-bg-surface-secondary rounded-full animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
