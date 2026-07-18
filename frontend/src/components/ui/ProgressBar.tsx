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
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
        purple: 'bg-purple-500',
        orange: 'bg-orange-500',
    };

    return (
        <div className={cn('w-full', className)}>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
                <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(percentage)}%</p>
            )}
        </div>
    );
}