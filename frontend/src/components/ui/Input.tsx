import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    textarea?: boolean;
}

export function Input({ label, error, helperText, className, id, textarea, ...props }: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const baseInputClass = cn(
        'w-full px-3 py-2 text-sm rounded-md bg-bg-surface-secondary border border-hairline text-text-default placeholder:text-text-muted/50 transition-colors duration-150',
        'focus:outline-none focus:border-accent-primary',
        'disabled:bg-bg-surface-secondary disabled:text-text-muted disabled:cursor-not-allowed',
        error ? 'border-status-danger/70 focus:border-status-danger' : '',
    );

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="label block mb-1">
                    {label}
                </label>
            )}
            {textarea ? (
                <textarea
                    {...(props as any)}
                    id={inputId}
                    className={cn(
                        baseInputClass,
                        'resize-none overflow-hidden',
                        className,
                    )}
                    aria-invalid={error ? true : false}
                    aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                    onInput={(e) => {
                        const target = e.currentTarget;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                    }}
                />
            ) : (
                <input
                    id={inputId}
                    className={cn(baseInputClass, className)}
                    aria-invalid={error ? true : false}
                    aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                    {...props}
                />
            )}
            {error && (
                <p id={`${inputId}-error`} className="mt-1 text-xs text-status-danger" role="alert">
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p id={`${inputId}-helper`} className="mt-1 text-xs text-text-muted">
                    {helperText}
                </p>
            )}
            {props.maxLength && !error && (
                <p className="mt-1 text-xs text-text-muted text-right">
                    Límite: {props.maxLength} caracteres
                </p>
            )}
        </div>
    );
}
