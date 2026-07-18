import { cn } from '../../utils/cn';

type EstadoMateria = 'Completada' | 'En Proceso' | 'Pendiente';

const ESTILOS: Record<EstadoMateria, { dot: string; badge: string; label: string }> = {
    Completada: {
        dot: 'bg-neon-green shadow-neon-green',
        badge: 'bg-neon-green/15 text-neon-green border border-neon-green/30',
        label: 'Completada',
    },
    'En Proceso': {
        dot: 'bg-neon-yellow',
        badge: 'bg-neon-yellow/15 text-neon-yellow border border-neon-yellow/30',
        label: 'En Proceso',
    },
    Pendiente: {
        dot: 'bg-neon-red',
        badge: 'bg-neon-red/15 text-neon-red border border-neon-red/30',
        label: 'Pendiente',
    },
};

const ESTILOS_FALLBACK = {
    dot: 'bg-slate-400',
    badge: 'bg-slate-700/40 text-slate-300 border border-slate-600/50',
    label: 'Pendiente',
};

export function StatusDot({ estado, className }: { estado?: string; className?: string }) {
    const estilo = (ESTILOS as Record<string, typeof ESTILOS_FALLBACK>)[estado ?? ''] ?? ESTILOS_FALLBACK;
    return (
        <span
            className={cn('inline-block w-2.5 h-2.5 rounded-full', estilo.dot, className)}
            aria-label={estilo.label}
        />
    );
}

export function StatusBadge({ estado, children, className }: { estado?: string; children?: React.ReactNode; className?: string }) {
    const estilo = (ESTILOS as Record<string, typeof ESTILOS_FALLBACK>)[estado ?? ''] ?? ESTILOS_FALLBACK;
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full',
                estilo.badge,
                className,
            )}
        >
            <StatusDot estado={estado} />
            {children ?? estilo.label}
        </span>
    );
}
