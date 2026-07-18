import { cn } from '../../utils/cn';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
    className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
    const variants = {
        default: 'bg-slate-700/40 text-slate-300 border border-slate-600/50',
        success: 'bg-neon-green/15 text-neon-green border border-neon-green/30',
        warning: 'bg-neon-yellow/15 text-neon-yellow border border-neon-yellow/30',
        danger: 'bg-neon-red/15 text-neon-red border border-neon-red/30',
        info: 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30',
    };
    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
    };

    return (
        <span className={cn('inline-flex items-center font-medium rounded-full', variants[variant], sizes[size], className)}>
            {children}
        </span>
    );
}