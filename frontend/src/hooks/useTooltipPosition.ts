import { useCallback, useState, type MouseEvent } from 'react';

export interface TooltipPosition {
    x: number;
    y: number;
}

export function useTooltipPosition() {
    const [pos, setPos] = useState<TooltipPosition | null>(null);

    const onMouseMove = useCallback((event: MouseEvent<HTMLDivElement>) => {
        setPos({ x: event.clientX, y: event.clientY });
    }, []);

    const onMouseLeave = useCallback(() => {
        setPos(null);
    }, []);

    return { pos, onMouseMove, onMouseLeave };
}
