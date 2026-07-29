import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminMaterias } from '../../hooks/useAdminMaterias';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Paginador } from '../ui/Paginador';
import { FiltrosModal, type FiltrosState } from './FiltrosModal';
import { Modal } from '../ui/Modal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { QueryError } from '../common/QueryError';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { MateriaAdminRow } from '../../types/materia.types';

const SORT_OPTIONS = [
    { value: 'nombre-ASC', label: 'Nombre (A-Z)' },
    { value: 'nombre-DESC', label: 'Nombre (Z-A)' },
    { value: 'creditos-ASC', label: 'Créditos (menor a mayor)' },
    { value: 'creditos-DESC', label: 'Créditos (mayor a menor)' },
    { value: 'cargaHoraria-ASC', label: 'Carga horaria (menor a mayor)' },
    { value: 'cargaHoraria-DESC', label: 'Carga horaria (mayor a menor)' },
];

export function TablaMaterias() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useLocalStorage<number>('admin-materias-page', 1);
    const [limit, setLimit] = useLocalStorage<number>('admin-materias-limit', 20);
    const [filters, setFilters] = useState<FiltrosState>({
        sortBy: 'nombre',
        sortOrder: 'ASC',
        incluirInactivos: false,
    });
    const [filtrosOpen, setFiltrosOpen] = useState(false);
    const [eliminarConfirm, setEliminarConfirm] = useState<MateriaAdminRow | null>(null);

    useEffect(() => {
        if (search === debouncedSearch) return;
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [search, debouncedSearch, setPage]);

    const { listarMaterias, eliminarMateria, restaurarMateria } = useAdminMaterias(
        { ...filters, search: debouncedSearch || undefined },
        page,
        limit,
    );

    const { data, isLoading, isError, error, refetch } = listarMaterias;

    const handleEliminar = () => {
        if (!eliminarConfirm) return;
        eliminarMateria.mutate(eliminarConfirm.materiaId, {
            onSuccess: () => setEliminarConfirm(null),
        });
    };

    const handlePageChange = (p: number) => setPage(p);
    const handleLimitChange = (l: number) => {
        setLimit(l);
        setPage(1);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar materias por nombre o código..."
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
                <div className="space-y-2">
                    {data.data.map((materia: MateriaAdminRow) => (
                        <div
                            key={materia.materiaId}
                            className="flex items-center gap-4 bg-base-800/30 border border-base-700/50 rounded-lg px-5 py-4 hover:bg-base-800/50 hover:border-base-600/50 transition-all"
                        >
                            <div className="flex-1 min-w-0 flex items-center gap-4">
                                <Badge variant="info" size="sm">{materia.codigo}</Badge>
                                <span className="text-sm font-medium text-white truncate">
                                    {materia.nombre}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-slate-400 bg-base-800/80 px-2.5 py-1 rounded-full border border-base-700/50">
                                    {materia.cargaHoraria} horas
                                </span>
                                <span className="text-xs text-slate-400 bg-base-800/80 px-2.5 py-1 rounded-full border border-base-700/50">
                                    {materia.creditos} créditos
                                </span>
                                <Badge variant="info" size="sm">{materia.totalCarreras ?? 0} carreras</Badge>
                                {filters.incluirInactivos && (
                                    <Badge variant={materia.activo ? 'success' : 'danger'} size="sm">
                                        {materia.activo ? 'Activa' : 'Inactiva'}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0 border-l border-base-700/50 pl-3">
                                <button
                                    title="Ver detalle"
                                    onClick={() => navigate(`/admin/materias/${materia.materiaId}`)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-base-700/60 rounded-lg transition-all"
                                >
                                    <Icon name="ver" className="w-4 h-4" />
                                </button>
                                <button
                                    title="Editar"
                                    onClick={() => navigate(`/admin/materias/${materia.materiaId}/editar`)}
                                    className="p-2 text-slate-400 hover:text-neon-cyan hover:bg-base-700/60 rounded-lg transition-all"
                                >
                                    <Icon name="edit" className="w-4 h-4" />
                                </button>
                                {materia.activo ? (
                                    <button
                                        title="Eliminar"
                                        onClick={() => setEliminarConfirm(materia)}
                                        className="p-2 text-slate-400 hover:text-neon-red hover:bg-base-700/60 rounded-lg transition-all"
                                    >
                                        <Icon name="delete" className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        title="Restaurar"
                                        onClick={() => restaurarMateria.mutate(materia.materiaId)}
                                        className="p-2 text-slate-400 hover:text-neon-cyan hover:bg-base-700/60 rounded-lg transition-all"
                                    >
                                        <Icon name="restore" className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {data.data.length === 0 && (
                        <div className="py-8 text-center text-slate-400">
                            No se encontraron materias
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
                title="Desactivar materia"
                size="md"
            >
                {eliminarConfirm && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-300">
                            Estás por desactivar la materia <strong className="text-white">{eliminarConfirm.nombre}</strong> ({eliminarConfirm.codigo}).
                        </p>
                        <div className="bg-neon-yellow/10 border border-neon-yellow/30 rounded-lg p-3">
                            <p className="text-sm text-neon-yellow font-medium">Información importante</p>
                            <ul className="mt-2 text-sm text-slate-300 list-disc list-inside space-y-1">
                                <li>Los datos de progreso de esta materia serán eliminados</li>
                                <li>Las planificaciones que incluyan esta materia serán eliminadas</li>
                                <li>Las correlativas asociadas serán eliminadas</li>
                                <li>Si se restaura la materia, habrá que reasignarla a carreras y rehacer planificaciones</li>
                            </ul>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setEliminarConfirm(null)}>Cancelar</Button>
                            <Button variant="danger" onClick={handleEliminar} loading={eliminarMateria.isPending}>
                                Desactivar materia
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}