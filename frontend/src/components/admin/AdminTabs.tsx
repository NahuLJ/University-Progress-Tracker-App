import { cn } from '../../utils/cn';

type TabKey = 'carreras' | 'materias' | 'plan' | 'correlativas';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'carreras', label: 'Carreras' },
    { key: 'materias', label: 'Materias' },
    { key: 'plan', label: 'Plan de estudios' },
    { key: 'correlativas', label: 'Correlativas' },
];

export function AdminTabs({
    active,
    onChange,
}: {
    active: TabKey;
    onChange: (key: TabKey) => void;
}) {
    return (
        <div className="flex gap-2 border-b border-base-600 mb-6">
            {TABS.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={cn(
                        'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                        active === tab.key
                            ? 'border-neon-cyan text-neon-cyan'
                            : 'border-transparent text-slate-300 hover:text-white',
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
