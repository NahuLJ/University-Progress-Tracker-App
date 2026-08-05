import { cn } from '../../utils/cn';

export type TabKey = 'datos' | 'plan' | 'correlativas' | 'creditos';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'datos', label: 'Datos generales' },
    { key: 'plan', label: 'Plan de estudios' },
    { key: 'correlativas', label: 'Correlativas' },
    { key: 'creditos', label: 'Créditos' },
];

export function CarreraEditTabs({
    active,
    onChange,
}: {
    active: TabKey;
    onChange: (key: TabKey) => void;
}) {
    return (
        <div className="flex gap-2 border-b border-hairline mb-6">
            {TABS.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={cn(
                        'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                        active === tab.key
                            ? 'border-accent-primary text-accent-primary'
                            : 'border-transparent text-text-muted hover:text-text-default',
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
