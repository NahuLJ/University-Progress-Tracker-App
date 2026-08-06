import { cn } from '../../utils/cn';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { CreditosCatalogoCategoriasTab } from './CreditosCatalogoCategoriasTab';
import { CreditosCatalogoActividadesTab } from './CreditosCatalogoActividadesTab';

type TabKey = 'categorias' | 'actividades';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'categorias', label: 'Categorías' },
    { key: 'actividades', label: 'Actividades' },
];

export function CreditosCatalogoTabs() {
    const [tab, setTab] = useLocalStorage<TabKey>('admin-creditos-tab', 'categorias');

    return (
        <div className="space-y-5">
            <div className="flex gap-2 border-b border-hairline mb-4">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                            tab === t.key
                                ? 'border-accent-primary text-accent-primary'
                                : 'border-transparent text-text-muted hover:text-text-default',
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'categorias' && <CreditosCatalogoCategoriasTab />}
            {tab === 'actividades' && <CreditosCatalogoActividadesTab />}
        </div>
    );
}
