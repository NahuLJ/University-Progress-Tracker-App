import { Icon, type IconName } from '../ui/Icon';

interface EmptyStateProps {
    iconName: IconName;
    title: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ iconName, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={`text-center py-12 ${className}`}>
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-neon-cyan/10 text-neon-cyan shadow-neon-cyan">
                <Icon name={iconName} className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            <p className="text-slate-400 mb-6">{description}</p>
            {action && <div>{action}</div>}
        </div>
    );
}