import { cn } from '../../utils/cn';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
    className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
    const variants = {
        default: 'bg-slate-500/15 text-text-subtle',
        success: 'bg-status-success/15 text-status-success',
        warning: 'bg-status-warning/15 text-status-warning',
        danger: 'bg-status-danger/15 text-status-danger',
        info: 'bg-accent-primary/15 text-accent-primary',
    };
    const sizes = {
        sm: 'px-[6px] py-[2px] font-mono text-[11px]',
        md: 'px-[6px] py-[2px] font-mono text-xs',
    };

    return (
        <span className={cn('inline-flex items-center rounded transition-colors duration-150', variants[variant], sizes[size], className)}>
            {children}
        </span>
    );
}
