import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export function Input({ label, error, helperText, className, id, ...props }: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-slate-300 mb-1">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={cn(
                    'w-full px-3 py-2 bg-base-800/80 border rounded-lg shadow-inner text-slate-100 placeholder:text-slate-500 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan/60',
                    'disabled:bg-base-700 disabled:text-slate-500 disabled:cursor-not-allowed',
                    error ? 'border-neon-red/70 text-neon-red placeholder-neon-red/50' : 'border-base-500',
                    className,
                )}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                {...props}
            />
            {error && (
                <p id={`${inputId}-error`} className="mt-1 text-sm text-neon-red" role="alert">
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p id={`${inputId}-helper`} className="mt-1 text-sm text-slate-400">
                    {helperText}
                </p>
            )}
        </div>
    );
}