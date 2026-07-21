import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, placeholder, id, children, ...props }, ref) => {
        const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
        return (
            <div className="space-y-1">
                {label && (
                    <label htmlFor={selectId} className="block text-sm font-medium text-slate-300">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    className={cn(
                        'w-full px-3 py-2 bg-base-800/80 border rounded-lg shadow-inner text-slate-100 transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan/60',
                        error && 'border-neon-red/70 focus:ring-neon-red',
                        !error && 'border-base-500',
                        className
                    )}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${selectId}-error` : undefined}
                    {...props}
                >
                    {placeholder && <option value="" className="bg-base-800">{placeholder}</option>}
                    {children}
                </select>
                {error && (
                    <p id={`${selectId}-error`} className="text-sm text-neon-red" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';