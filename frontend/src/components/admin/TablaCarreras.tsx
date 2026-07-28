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
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [filters, setFilters] = useState<FiltrosState>({
        sortBy: 'nombre',
        sortOrder: 'ASC',
        incluirInactivos: false,
    });
    const [filtrosOpen, setFiltrosOpen] = useState(false);
    const [eliminarConfirm, setEliminarConfirm] = useState<CarreraAdminRow | null>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

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
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar carreras por nombre..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-base-800/80 border border-base-500 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan"
                    />
                </div>
                <Button variant="outline" size="sm" onClick={() => setFiltrosOpen(true)}>
                    <Icon name="filter" className="w-4 h-4 mr-1" /> Filtrar
                </Button>
            </div>

            {isLoading && <LoadingSpinner />}
            {isError && <QueryError error={error} onRetry={() => refetch()} />}

            {data && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-base-600 text-slate-400 text-left">
                                <th className="py-3 px-4 font-medium">Nombre</th>
                                <th className="py-3 px-4 font-medium">Descripción</th>
                                <th className="py-3 px-4 font-medium">Duración</th>
                                <th className="py-3 px-4 font-medium">Materias</th>
                                {filters.incluirInactivos && <th className="py-3 px-4 font-medium">Estado</th>}
                                <th className="py-3 px-4 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.data.map((carrera: CarreraAdminRow) => (
                                <tr key={carrera.carreraId} className="border-b border-base-700/50 hover:bg-base-700/30 transition-colors">
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={() => navigate(`/carreras/${carrera.carreraId}`)}
                                            className="text-neon-cyan hover:underline text-left"
                                        >
                                            {carrera.nombre}
                                        </button>
                                    </td>
                                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                                        {carrera.descripcion ?? '-'}
                                    </td>
                                    <td className="py-3 px-4 text-slate-300">{carrera.duracionAnios} años</td>
                                    <td className="py-3 px-4">
                                        <Badge variant="info" size="sm">{carrera.totalMaterias ?? 0}</Badge>
                                    </td>
                                    {filters.incluirInactivos && (
                                        <td className="py-3 px-4">
                                            <Badge variant={carrera.activo ? 'success' : 'danger'} size="sm">
                                                {carrera.activo ? 'Activa' : 'Inactiva'}
                                            </Badge>
                                        </td>
                                    )}
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                title="Ver detalle"
                                                onClick={() => navigate(`/carreras/${carrera.carreraId}`)}
                                                className="text-slate-400 hover:text-white transition-colors"
                                            >
                                                <Icon name="ver" className="w-4 h-4" />
                                            </button>
                                            <button
                                                title="Editar"
                                                onClick={() => navigate(`/admin/carreras/${carrera.carreraId}/editar`)}
                                                className="text-slate-400 hover:text-neon-cyan transition-colors"
                                            >
                                                <Icon name="edit" className="w-4 h-4" />
                                            </button>
                                            {carrera.activo ? (
                                                <button
                                                    title="Eliminar"
                                                    onClick={() => setEliminarConfirm(carrera)}
                                                    className="text-slate-400 hover:text-neon-red transition-colors"
                                                >
                                                    <Icon name="delete" className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    title="Restaurar"
                                                    onClick={() => restaurarCarrera.mutate(carrera.carreraId)}
                                                    className="text-slate-400 hover:text-neon-cyan transition-colors"
                                                >
                                                    <Icon name="restore" className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.data.length === 0 && (
                                <tr>
                                    <td colSpan={filters.incluirInactivos ? 6 : 5} className="py-8 text-center text-slate-400">
                                        No se encontraron carreras
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
                        <p className="text-sm text-slate-300">
                            Estás por desactivar la carrera <strong className="text-white">{eliminarConfirm.nombre}</strong>.
                        </p>
                        <div className="bg-neon-yellow/10 border border-neon-yellow/30 rounded-lg p-3">
                            <p className="text-sm text-neon-yellow font-medium">Información importante</p>
                            <ul className="mt-2 text-sm text-slate-300 list-disc list-inside space-y-1">
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