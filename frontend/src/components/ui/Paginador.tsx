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
            <p className="text-sm text-slate-400">
                Mostrando {desde}-{hasta} de {total} resultados
            </p>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                    {getPages().map((p, i) =>
                        p === '...' ? (
                            <span key={`ellipsis-${i}`} className="px-1 text-slate-500">...</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onPageChange(p)}
                                className={`px-3 py-1 text-sm rounded transition-colors ${
                                    p === page
                                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                                        : 'text-slate-400 hover:text-white hover:bg-base-700'
                                }`}
                            >
                                {p}
                            </button>
                        ),
                    )}
                </div>
                <select
                    value={limit}
                    onChange={(e) => onLimitChange(Number(e.target.value))}
                    className="ml-2 px-2 py-1 text-sm bg-base-800 border border-base-500 rounded text-slate-300"
                >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>
        </div>
    );
}