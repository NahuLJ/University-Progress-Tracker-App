import { cn } from '../../utils/cn';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
    onClick?: () => void;
}

export function Card({ children, className, title, subtitle, onClick }: CardProps) {
    return (
        <div
            className={cn('card flex flex-col', className, onClick && 'cursor-pointer hover:bg-bg-surface-secondary transition-colors')}
            onClick={onClick}
        >
            {(title || subtitle) && (
                <div className="px-4 py-3 border-b border-hairline">
                    {title && <h3 className="text-sm font-semibold text-text-default">{title}</h3>}
                    {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
                </div>
            )}
            <div className="p-4 flex-1">{children}</div>
        </div>
    );
}
