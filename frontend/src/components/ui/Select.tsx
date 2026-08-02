import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    label?: string;
    error?: string;
    placeholder?: string;
}

interface OptionProps {
    value: string;
    children: React.ReactNode;
    disabled?: boolean;
}

function getChildrenText(children: React.ReactNode): string {
    return React.Children.toArray(children)
        .map((child) => {
            if (typeof child === 'string' || typeof child === 'number') {
                return String(child);
            }
            if (React.isValidElement(child)) {
                return getChildrenText((child as any).props.children);
            }
            return '';
        })
        .join('');
}

function parseOptions(children: React.ReactNode): { value: string; label: string; disabled: boolean }[] {
    return React.Children.toArray(children).filter(
        (child): child is React.ReactElement<OptionProps> =>
            React.isValidElement(child) && child.type === 'option',
    ).map((option) => ({
        value: String(option.props.value ?? ''),
        label: getChildrenText(option.props.children),
        disabled: option.props.disabled ?? false,
    }));
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, placeholder, id, children, value, onChange, disabled }, ref) => {
        const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
        const [open, setOpen] = useState(false);
        const containerRef = useRef<HTMLDivElement>(null);

        const options = parseOptions(children);
        const selectedOption = options.find((o) => o.value === String(value));
        const displayText = selectedOption ? selectedOption.label : (placeholder || '');

        useEffect(() => {
            const handleClick = (e: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                    setOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }, []);

        const handleSelect = (optionValue: string) => {
            onChange?.({ target: { value: optionValue } } as React.ChangeEvent<HTMLSelectElement>);
            setOpen(false);
        };

        return (
            <div ref={containerRef} className="space-y-1 relative">
                {label && (
                    <label htmlFor={selectId} className="label block">
                        {label}
                    </label>
                )}
                <button
                    type="button"
                    id={selectId}
                    ref={ref as any}
                    className={cn(
                        'w-full px-3 py-2 text-sm rounded-md bg-bg-surface-secondary border border-hairline text-text-default transition-colors duration-150 flex items-center justify-between',
                        'focus:outline-none focus:border-accent-primary',
                        error ? 'border-status-danger/70 focus:border-status-danger' : '',
                        disabled && 'opacity-50 cursor-not-allowed',
                        className,
                    )}
                    onClick={() => !disabled && setOpen(!open)}
                    disabled={disabled}
                    aria-expanded={open}
                    aria-haspopup="listbox"
                >
                    <span className="truncate">{displayText}</span>
                    <svg className="w-4 h-4 text-text-muted flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {open && (
                    <div className="absolute z-10 w-full mt-1 bg-bg-surface border border-hairline rounded-md max-h-48 overflow-y-auto scrollbar-none">
                        {options.map((option, index) => (
                            <div
                                key={option.value + index}
                                role="option"
                                aria-selected={option.value === String(value)}
                                className={cn(
                                    'px-3 py-2 text-sm cursor-pointer transition-colors',
                                    option.value === String(value)
                                        ? 'bg-accent-primary/10 text-accent-primary'
                                        : 'text-text-default hover:bg-bg-surface-secondary',
                                    option.disabled && 'opacity-40 cursor-not-allowed',
                                )}
                                onClick={() => !option.disabled && handleSelect(option.value)}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                )}
                {error && (
                    <p id={`${selectId}-error`} className="text-xs text-status-danger" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    },
);

Select.displayName = 'Select';
