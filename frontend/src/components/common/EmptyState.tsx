interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={`text-center py-12 ${className}`}>
            <div className="text-6xl mb-4">{icon}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600 mb-6">{description}</p>
            {action && <div>{action}</div>}
        </div>
    );
}