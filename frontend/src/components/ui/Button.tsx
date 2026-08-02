import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'warning' | 'success';
    size?: 'sm' | 'md' | 'lg';
}

export function Button({
    children,
    loading = false,
    variant = 'primary',
    size = 'md',
    disabled,
    className,
    ...props
}: ButtonProps) {
    const variants = {
        primary: 'bg-accent-primary text-accent-foreground hover:opacity-90',
        secondary: 'bg-bg-surface-secondary text-text-default hover:bg-bg-surface-secondary/80',
        outline: 'bg-transparent border border-hairline text-text-muted hover:text-text-default hover:border-text-muted/40',
        ghost: 'bg-transparent text-text-muted hover:text-text-default hover:bg-bg-surface-secondary',
        danger: 'bg-transparent border border-hairline text-text-muted hover:text-status-danger hover:border-status-danger/40',
        warning: 'bg-transparent border border-hairline text-text-muted hover:text-status-warning hover:border-status-warning/40',
        success: 'bg-transparent border border-hairline text-text-muted hover:text-status-success hover:border-status-success/40',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-3 py-2 text-xs',
        lg: 'px-4 py-2.5 text-sm',
    };

    return (
        <button
            className={cn(
                'inline-flex items-center justify-center gap-2 font-medium rounded-md',
                'transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-accent-primary',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                variants[variant],
                sizes[size],
                className,
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {children}
        </button>
    );
}
