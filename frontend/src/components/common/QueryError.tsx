import { Alert } from '../ui/Alert';

interface QueryErrorProps {
    error: unknown;
    onRetry?: () => void;
}

export function QueryError({ error, onRetry }: QueryErrorProps) {
    const mensaje =
        error instanceof Error
            ? error.message
            : 'No se pudieron cargar los datos. Intentá nuevamente.';

    return (
        <Alert variant="error">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>{mensaje}</span>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="text-sm font-medium underline hover:no-underline"
                    >
                        Reintentar
                    </button>
                )}
            </div>
        </Alert>
    );
}
