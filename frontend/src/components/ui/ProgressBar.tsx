import { cn } from '../../utils/cn';

interface ProgressBarProps {
    value: number;
    max?: number;
    className?: string;
    showLabel?: boolean;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
}

export function ProgressBar({ value, max = 100, className, showLabel = false, color = 'blue' }: ProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const colors = {
        blue: 'bg-neon-cyan shadow-neon-cyan',
        green: 'bg-neon-green shadow-neon-green',
        yellow: 'bg-neon-yellow shadow-neon-yellow',
        red: 'bg-neon-red shadow-neon-red',
        purple: 'bg-neon-violet shadow-neon-violet',
        orange: 'bg-neon-orange',
    };

    return (
        <div className={cn('w-full', className)}>
            <div className="h-2 bg-base-600 rounded-full overflow-hidden">
                <div
                    className={cn('h-full transition-all duration-300 rounded-full', colors[color])}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                />
            </div>
            {showLabel && (
                <p className="text-xs text-slate-400 mt-1 text-right">{Math.round(percentage)}%</p>
            )}
        </div>
    );
}