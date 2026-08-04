import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminCarreras } from '../../hooks/useAdminCarreras';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Paginador } from '../ui/Paginador';
import { FiltrosModal, type FiltrosState } from './FiltrosModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { QueryError } from '../common/QueryError';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatearDuracion } from '../../utils/formato';
import type { CarreraAdminRow } from '../../types/carrera.types';

const SORT_OPTIONS = [
    { value: 'nombre-ASC', label: 'Nombre (A-Z)' },
    { value: 'nombre-DESC', label: 'Nombre (Z-A)' },
    { value: 'duracionAnios-ASC', label: 'Duración (menor a mayor)' },
    { value: 'duracionAnios-DESC', label: 'Duración (mayor a menor)' },
];

export function TablaCarreras() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useLocalStorage<number>('admin-carreras-page', 1);
    const [limit, setLimit] = useLocalStorage<number>('admin-carreras-limit', 20);
    const [filters, setFilters] = useState<FiltrosState>({
        sortBy: 'nombre',
        sortOrder: 'ASC',
        incluirInactivos: false,
    });
    const [filtrosOpen, setFiltrosOpen] = useState(false);
    const [eliminarConfirm, setEliminarConfirm] = useState<CarreraAdminRow | null>(null);

    useEffect(() => {
        if (search === debouncedSearch) return;
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [search, debouncedSearch, setPage]);

    const { listarCarreras, eliminarCarrera, restaurarCarrera } = useAdminCarreras(
        { ...filters, search: debouncedSearch || undefined },
        page,
        limit,
    );

    const { data, isLoading, isError, error, refetch } = listarCarreras;

    const handlePageChange = (p: number) => setPage(p);
    const handleLimitChange = (l: number) => {
        setLimit(l);
        setPage(1);
    };

    const handleEliminar = () => {
        if (!eliminarConfirm) return;
        eliminarCarrera.mutate(eliminarConfirm.carreraId, {
            onSuccess: () => setEliminarConfirm(null),
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Buscar carreras por nombre..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-10"
                    />
                </div>
                <Button variant="outline" size="sm" onClick={() => setFiltrosOpen(true)}>
                    <Icon name="filter" className="w-4 h-4 mr-1" /> Filtrar
                </Button>
            </div>

            {isLoading && <LoadingSpinner />}
            {isError && <QueryError error={error} onRetry={() => refetch()} />}

            {data && (
                <div className="space-y-2">
                    {data.data.map((carrera: CarreraAdminRow) => (
                        <div
                            key={carrera.carreraId}
                            className="flex items-center gap-4 bg-bg-surface-secondary/30 border border-hairline rounded-md px-5 py-4 hover:bg-bg-surface-secondary/60 transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-default truncate">{carrera.nombre}</p>
                                <p className="text-xs text-text-muted truncate mt-0.5">{carrera.descripcion ?? '-'}</p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <span className="badge badge-gray">
                                    {formatearDuracion(carrera.duracionAnios)} años
                                </span>
                                <Badge variant="info" size="sm">{carrera.totalMaterias ?? 0} materias</Badge>
                                {filters.incluirInactivos && (
                                    <Badge variant={carrera.activo ? 'success' : 'danger'} size="sm">
                                        {carrera.activo ? 'Activa' : 'Inactiva'}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0 border-l border-hairline pl-3">
                                <button
                                    title="Ver detalle"
                                    onClick={() => navigate(`/carreras/${carrera.carreraId}`)}
                                    className="p-2 text-text-muted hover:text-text-default hover:bg-bg-surface-secondary rounded-md transition-colors"
                                >
                                    <Icon name="ver" className="w-4 h-4" />
                                </button>
                                <button
                                    title="Editar"
                                    onClick={() => navigate(`/admin/carreras/${carrera.carreraId}/editar`)}
                                    className="p-2 text-text-muted hover:text-accent-primary hover:bg-bg-surface-secondary rounded-md transition-colors"
                                >
                                    <Icon name="edit" className="w-4 h-4" />
                                </button>
                                {carrera.activo ? (
                                    <button
                                        title="Eliminar"
                                        onClick={() => setEliminarConfirm(carrera)}
                                        className="p-2 text-text-muted hover:text-status-danger hover:bg-bg-surface-secondary rounded-md transition-colors"
                                    >
                                        <Icon name="delete" className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        title="Restaurar"
                                        onClick={() => restaurarCarrera.mutate(carrera.carreraId)}
                                        className="p-2 text-text-muted hover:text-accent-primary hover:bg-bg-surface-secondary rounded-md transition-colors"
                                    >
                                        <Icon name="restore" className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {data.data.length === 0 && (
                        <div className="py-8 text-center text-text-muted">
                            No se encontraron carreras
                        </div>
                    )}
                </div>
            )}

            {data && (
                <Paginador
                    page={data.page}
                    limit={data.limit}
                    total={data.total}
                    totalPages={data.totalPages}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                />
            )}

            <FiltrosModal
                isOpen={filtrosOpen}
                onClose={() => setFiltrosOpen(false)}
                onApply={(f) => {
                    setFilters(f);
                    setPage(1);
                }}
                sortOptions={SORT_OPTIONS}
                defaultValues={filters}
            />

            <Modal
                isOpen={!!eliminarConfirm}
                onClose={() => setEliminarConfirm(null)}
                title="Desactivar carrera"
                size="md"
            >
                {eliminarConfirm && (
                    <div className="space-y-4">
                        <p className="text-sm text-text-subtle">
                            Estás por desactivar la carrera <strong className="text-text-default">{eliminarConfirm.nombre}</strong>.
                        </p>
                        <div className="bg-status-warning/10 border border-status-warning/30 rounded-md p-3">
                            <p className="text-sm text-status-warning font-medium">Información importante</p>
                            <ul className="mt-2 text-sm text-text-subtle list-disc list-inside space-y-1">
                                <li>Los usuarios inscriptos no podrán acceder a esta carrera (desaparece de dashboard, progreso, planificaciones y trayectorias)</li>
                                <li>Todos los datos de progreso, planificaciones y trayectorias se conservan en la base de datos</li>
                                <li>Si se restaura la carrera, los usuarios recuperarán el acceso completo a sus datos</li>
                            </ul>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setEliminarConfirm(null)}>Cancelar</Button>
                            <Button variant="danger" onClick={handleEliminar} loading={eliminarCarrera.isPending}>
                                Desactivar carrera
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}