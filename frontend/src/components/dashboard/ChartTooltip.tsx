interface ChartTooltipPayloadItem {
    name?: string | number;
    value?: number | string | Array<number | string>;
    color?: string;
    fill?: string;
    dataKey?: string | number;
}

interface ChartTooltipProps {
    active?: boolean;
    payload?: ChartTooltipPayloadItem[];
}

export function ChartTooltip({ active, payload }: ChartTooltipProps) {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div className="rounded-md border border-hairline bg-bg-surface px-3 py-2 text-xs shadow-lg pointer-events-none">
            {payload.map((entry, index) => (
                <div key={`${entry.dataKey ?? index}`} className="flex items-center gap-2">
                    <span
                        className="inline-block w-2 h-2 rounded-full shrink-0"
                        style={{ background: entry.color || entry.fill || '#6366f1' }}
                    />
                    <span className="text-text-muted">{entry.name}</span>
                    <span className="ml-2 font-mono text-text-default">{entry.value}</span>
                </div>
            ))}
        </div>
    );
}
