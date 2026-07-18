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
            className={cn('card', className, onClick && 'cursor-pointer hover:border-neon-cyan/60 hover:shadow-neon-cyan transition-all')}
            onClick={onClick}
        >
            {(title || subtitle) && (
                <div className="px-6 py-4 border-b border-base-600">
                    {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
                    {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
                </div>
            )}
            <div className="p-6">{children}</div>
        </div>
    );
}