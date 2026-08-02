import { cn } from '../../utils/cn';

interface ProgressBarProps {
    value: number;
    max?: number;
    className?: string;
    showLabel?: boolean;
    color?: 'primary' | 'cyan' | 'success' | 'warning' | 'danger';
}

export function ProgressBar({ value, max = 100, className, showLabel = false, color = 'primary' }: ProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const colors = {
        primary: 'bg-accent-primary',
        cyan: 'bg-gradient-to-r from-accent-primary to-accent-cyan',
        success: 'bg-status-success',
        warning: 'bg-status-warning',
        danger: 'bg-status-danger',
    };

    return (
        <div className={cn('w-full', className)}>
            <div className="h-1.5 bg-bg-surface-secondary rounded-full overflow-hidden">
                <div
                    className={cn('h-full transition-[width] duration-500 ease-in-out rounded-full', colors[color])}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                />
            </div>
            {showLabel && (
                <p className="label mt-1 text-right">{Math.round(percentage)}%</p>
            )}
        </div>
    );
}
