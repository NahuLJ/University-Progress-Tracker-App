import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
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
        primary: 'bg-neon-cyan text-base-900 font-semibold shadow-neon-cyan hover:bg-cyan-300 hover:shadow-[0_0_10px_rgba(34,211,238,0.8)]',
        secondary: 'bg-neon-violet/10 text-neon-violet border border-neon-violet/40 hover:bg-neon-violet/20 hover:shadow-neon-violet',
        outline: 'border-2 border-neon-cyan/60 text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-neon-cyan',
        ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
        danger: 'bg-neon-red/80 text-white border border-neon-red/60 hover:bg-neon-red hover:shadow-[0_0_10px_rgba(248,113,113,0.7)]',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            className={cn(
                'inline-flex items-center justify-center font-medium rounded-lg transition-all',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-900',
                'disabled:opacity-50 disabled:cursor-not-allowed',
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