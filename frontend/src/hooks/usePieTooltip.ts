import { useCallback, useMemo, useRef, useState, type MouseEvent } from 'react';

const PADDING_ANGLE = 2;

interface PieSlice {
    start: number;
    end: number;
}

function computeSlices(data: Array<{ cantidad: number }>): PieSlice[] {
    const sum = data.reduce((acc, d) => acc + d.cantidad, 0);
    if (sum <= 0) return [];

    const notZeroCount = data.filter((d) => d.cantidad !== 0).length;
    const realTotalAngle = 360 - Math.max(0, notZeroCount - 1) * PADDING_ANGLE;

    let prevEnd = 0;
    return data.map((d) => {
        const start = prevEnd;
        const end = start + (d.cantidad / sum) * realTotalAngle;
        prevEnd = end + PADDING_ANGLE;
        return { start, end };
    });
}

export interface PieHoverState {
    index: number;
    pos: { x: number; y: number };
}

export function usePieTooltip<T extends { cantidad: number }>(
    data: T[],
    innerRadius: number,
    outerRadius: number,
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState<PieHoverState | null>(null);

    const slices = useMemo(() => computeSlices(data), [data]);

    const onMouseMove = useCallback(
        (event: MouseEvent<HTMLDivElement>) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) {
                setHovered(null);
                return;
            }

            const dx = event.clientX - rect.left - rect.width / 2;
            const dy = event.clientY - rect.top - rect.height / 2;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < innerRadius || distance > outerRadius) {
                setHovered(null);
                return;
            }

            let angle = (Math.atan2(-dy, dx) * 180) / Math.PI;
            if (angle < 0) angle += 360;

            const index = slices.findIndex((s) => angle >= s.start && angle < s.end);
            if (index === -1) {
                setHovered(null);
                return;
            }

            setHovered({ index, pos: { x: event.clientX, y: event.clientY } });
        },
        [slices, innerRadius, outerRadius],
    );

    const onMouseLeave = useCallback(() => setHovered(null), []);

    return { containerRef, hovered, onMouseMove, onMouseLeave };
}
