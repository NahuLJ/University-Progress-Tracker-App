import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminMaterias } from '../../hooks/useAdminMaterias';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Paginador } from '../ui/Paginador';
import { FiltrosModal, type FiltrosState } from './FiltrosModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { QueryError } from '../common/QueryError';
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
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [filters, setFilters] = useState<FiltrosState>({
        sortBy: 'nombre',
        sortOrder: 'ASC',
        incluirInactivos: false,
    });
    const [filtrosOpen, setFiltrosOpen] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const { listarMaterias, eliminarMateria, restaurarMateria } = useAdminMaterias(
        { ...filters, search: debouncedSearch || undefined },
        page,
        limit,
    );

    const { data, isLoading, isError, error, refetch } = listarMaterias;

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
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-base-600 text-slate-400 text-left">
                                <th className="py-3 px-4 font-medium">Código</th>
                                <th className="py-3 px-4 font-medium">Nombre</th>
                                <th className="py-3 px-4 font-medium">Carga horaria</th>
                                <th className="py-3 px-4 font-medium">Créditos</th>
                                <th className="py-3 px-4 font-medium">Carreras</th>
                                {filters.incluirInactivos && <th className="py-3 px-4 font-medium">Estado</th>}
                                <th className="py-3 px-4 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.data.map((materia: MateriaAdminRow) => (
                                <tr key={materia.materiaId} className="border-b border-base-700/50 hover:bg-base-700/30 transition-colors">
                                    <td className="py-3 px-4 text-slate-300 font-mono">{materia.codigo}</td>
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={() => navigate(`/admin/materias/${materia.materiaId}`)}
                                            className="text-neon-cyan hover:underline text-left"
                                        >
                                            {materia.nombre}
                                        </button>
                                    </td>
                                    <td className="py-3 px-4 text-slate-300">{materia.cargaHoraria}h</td>
                                    <td className="py-3 px-4 text-slate-300">{materia.creditos}</td>
                                    <td className="py-3 px-4">
                                        <Badge variant="info" size="sm">{materia.totalCarreras ?? 0}</Badge>
                                    </td>
                                    {filters.incluirInactivos && (
                                        <td className="py-3 px-4">
                                            <Badge variant={materia.activo ? 'success' : 'danger'} size="sm">
                                                {materia.activo ? 'Activa' : 'Inactiva'}
                                            </Badge>
                                        </td>
                                    )}
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                title="Ver detalle"
                                                onClick={() => navigate(`/admin/materias/${materia.materiaId}`)}
                                                className="text-slate-400 hover:text-white transition-colors"
                                            >
                                                <Icon name="ver" className="w-4 h-4" />
                                            </button>
                                            <button
                                                title="Editar"
                                                onClick={() => navigate(`/admin/materias/${materia.materiaId}/editar`)}
                                                className="text-slate-400 hover:text-neon-cyan transition-colors"
                                            >
                                                <Icon name="edit" className="w-4 h-4" />
                                            </button>
                                            {materia.activo ? (
                                                <button
                                                    title="Eliminar"
                                                    onClick={() => eliminarMateria.mutate(materia.materiaId)}
                                                    className="text-slate-400 hover:text-neon-red transition-colors"
                                                >
                                                    <Icon name="delete" className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    title="Restaurar"
                                                    onClick={() => restaurarMateria.mutate(materia.materiaId)}
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
                                    <td colSpan={filters.incluirInactivos ? 7 : 6} className="py-8 text-center text-slate-400">
                                        No se encontraron materias
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
        </div>
    );
}