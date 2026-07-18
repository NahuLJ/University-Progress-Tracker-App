import { forwardRef, useState } from 'react';
import { cn } from '../../utils/cn';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
    ({ title, children, defaultOpen = false, className }, ref) => {
        const [isOpen, setIsOpen] = useState(defaultOpen);

        return (
            <div ref={ref} className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        'w-full px-4 py-3 bg-gray-50 border-b border-gray-200',
                        'flex items-center justify-between',
                        'hover:bg-gray-100 transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset'
                    )}
                    aria-expanded={isOpen}
                >
                    <span className="font-semibold text-gray-900">{title}</span>
                    <svg
                        className={cn(
                            'w-5 h-5 text-gray-500 transition-transform',
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