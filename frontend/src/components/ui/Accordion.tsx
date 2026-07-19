import { forwardRef, useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
    ({ title, children, defaultOpen = false, className, open, onOpenChange }, ref) => {
        const [isOpen, setIsOpen] = useState(defaultOpen);

        // Controlled mode: sync with external open prop
        useEffect(() => {
            if (open !== undefined) {
                setIsOpen(open);
            }
        }, [open]);

        const handleToggle = () => {
            const newOpen = !isOpen;
            setIsOpen(newOpen);
            onOpenChange?.(newOpen);
        };

        return (
        <div ref={ref} className={cn('border border-base-600 rounded-lg overflow-hidden bg-base-800/50', className)}>
            <button
                type="button"
                onClick={handleToggle}
                className={cn(
                    'w-full px-4 py-3 bg-base-700/70 border-b border-base-600',
                    'flex items-center justify-between',
                    'hover:bg-base-600 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-inset'
                )}
                aria-expanded={isOpen}
            >
                <span className="font-semibold text-white">{title}</span>
                <svg
                    className={cn(
                        'w-5 h-5 text-neon-cyan transition-transform',
                        isOpen && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={cn('overflow-hidden', isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0')}>
                <div className="p-4">{children}</div>
            </div>
        </div>
        );
    }
);

Accordion.displayName = 'Accordion';