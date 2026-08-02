import { Select } from './Select';

interface PaginadorProps {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
}

export function Paginador({ page, limit, total, totalPages, onPageChange, onLimitChange }: PaginadorProps) {
    const desde = total === 0 ? 0 : (page - 1) * limit + 1;
    const hasta = Math.min(page * limit, total);

    const getPages = (): (number | '...')[] => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                pages.push(i);
            }
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <p className="text-xs text-text-muted">
                Mostrando {desde}-{hasta} de {total} resultados
            </p>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                    {getPages().map((p, i) =>
                        p === '...' ? (
                            <span key={`ellipsis-${i}`} className="px-1 text-text-muted">...</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onPageChange(p)}
                                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                    p === page
                                        ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30'
                                        : 'text-text-muted hover:text-text-default hover:bg-bg-surface-secondary'
                                }`}
                            >
                                {p}
                            </button>
                        ),
                    )}
                </div>
                <Select
                    value={String(limit)}
                    onChange={(e) => onLimitChange(Number(e.target.value))}
                >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </Select>
            </div>
        </div>
    );
}
