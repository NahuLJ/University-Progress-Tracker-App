import { cn } from '../../utils/cn';

type EstadoMateria = 'Completada' | 'En Proceso' | 'Pendiente';

const ESTILOS: Record<EstadoMateria, { dot: string; badge: string; label: string }> = {
    Completada: {
        dot: 'bg-status-success',
        badge: 'badge badge-success',
        label: 'Completada',
    },
    'En Proceso': {
        dot: 'bg-status-warning',
        badge: 'badge badge-warning',
        label: 'En Proceso',
    },
    Pendiente: {
        dot: 'bg-status-danger',
        badge: 'badge badge-danger',
        label: 'Pendiente',
    },
};

const ESTILOS_FALLBACK = {
    dot: 'bg-slate-400',
    badge: 'badge badge-gray',
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
                'inline-flex items-center gap-1.5',
                estilo.badge,
                className,
            )}
        >
            <StatusDot estado={estado} />
            {children ?? estilo.label}
        </span>
    );
}
