import { useState, useEffect } from 'react';
import { useAdminCreditosCatalogo } from '../../hooks/useAdminCreditosCatalogo';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { QueryError } from '../common/QueryError';
import { CreditoCategoriaModal } from './CreditoCategoriaModal';
import type { CategoriaCredito } from '../../types/creditos.types';

type CategoriaModalState = { modo: 'crear' } | { modo: 'editar'; categoria: CategoriaCredito } | null;

export function CreditosCatalogoCategoriasTab() {
    const {
        categorias: categoriasQuery,
        actividades: actividadesQuery,
        crearCategoria,
        actualizarCategoria,
        eliminarCategoria,
        restaurarCategoria,
    } = useAdminCreditosCatalogo();

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [modal, setModal] = useState<CategoriaModalState>(null);
    const [eliminarConfirm, setEliminarConfirm] = useState<CategoriaCredito | null>(null);

    useEffect(() => {
        if (search === debouncedSearch) return;
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search, debouncedSearch]);

    const categorias = categoriasQuery.data ?? [];
    const actividades = actividadesQuery.data ?? [];

    const query = debouncedSearch.trim().toLowerCase();
    const filtradas = categorias.filter(
        (c) =>
            !query ||
            c.nombre.toLowerCase().includes(query) ||
            (c.descripcion ?? '').toLowerCase().includes(query),
    );

    const abrirCrear = () => {
        crearCategoria.reset();
        actualizarCategoria.reset();
        setModal({ modo: 'crear' });
    };

    const abrirEditar = (categoria: CategoriaCredito) => {
        crearCategoria.reset();
        actualizarCategoria.reset();
        setModal({ modo: 'editar', categoria });
    };

    const handleEliminar = () => {
        if (!eliminarConfirm) return;
        eliminarCategoria.mutate(eliminarConfirm.categoriaCreditoId, {
            onSuccess: () => setEliminarConfirm(null),
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Buscar categorías por nombre o descripción..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-10"
                    />
                </div>
                <Button size="sm" onClick={abrirCrear}>
                    Nueva categoría
                </Button>
            </div>

            {categoriasQuery.isLoading && <LoadingSpinner />}
            {categoriasQuery.isError && (
                <QueryError error={categoriasQuery.error} onRetry={() => categoriasQuery.refetch()} />
            )}

            <div className="space-y-2">
                {filtradas.map((categoria) => {
                    const totalActividades = actividades.filter(
                        (a) => a.categoriaCreditoId === categoria.categoriaCreditoId,
                    ).length;
                    const activas = actividades.filter(
                        (a) => a.categoriaCreditoId === categoria.categoriaCreditoId && a.activo,
                    ).length;
                    const inactivas = totalActividades - activas;

                    return (
                        <div
                            key={categoria.categoriaCreditoId}
                            className="flex items-center gap-4 bg-bg-surface-secondary/30 border border-hairline rounded-md px-5 py-4 hover:bg-bg-surface-secondary/60 transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-text-default truncate">
                                        {categoria.nombre}
                                    </span>
                                    <Badge variant={categoria.activo ? 'success' : 'danger'} size="sm">
                                        {categoria.activo ? 'Activa' : 'Inactiva'}
                                    </Badge>
                                </div>
                                {categoria.descripcion && (
                                    <p className="text-sm text-text-muted mt-1 line-clamp-2">
                                        {categoria.descripcion}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <Badge variant="info" size="sm">
                                    {totalActividades} actividades
                                </Badge>
                                {totalActividades > 0 && (
                                    <span className="text-xs text-text-muted">
                                        {activas} activas / {inactivas} inactivas
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0 border-l border-hairline pl-3">
                                <button
                                    title="Editar"
                                    onClick={() => abrirEditar(categoria)}
                                    className="p-2 text-text-muted hover:text-accent-primary hover:bg-bg-surface-secondary rounded-md transition-colors"
                                >
                                    <Icon name="edit" className="w-4 h-4" />
                                </button>
                                {categoria.activo ? (
                                    <button
                                        title="Eliminar"
                                        onClick={() => setEliminarConfirm(categoria)}
                                        className="p-2 text-text-muted hover:text-status-danger hover:bg-bg-surface-secondary rounded-md transition-colors"
                                    >
                                        <Icon name="delete" className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        title="Restaurar"
                                        onClick={() => restaurarCategoria.mutate(categoria.categoriaCreditoId)}
                                        className="p-2 text-text-muted hover:text-accent-primary hover:bg-bg-surface-secondary rounded-md transition-colors"
                                    >
                                        <Icon name="restore" className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                {filtradas.length === 0 && (
                    <div className="py-8 text-center text-text-muted">
                        No se encontraron categorías
                    </div>
                )}
            </div>

            <CreditoCategoriaModal
                key={modal === null ? 'cerrado' : modal.modo === 'crear' ? 'nueva' : `editar-${modal.categoria.categoriaCreditoId}`}
                isOpen={modal !== null}
                onClose={() => setModal(null)}
                modo={modal?.modo ?? 'crear'}
                elemento={modal?.modo === 'editar' ? modal.categoria : undefined}
                crearCategoria={crearCategoria}
                actualizarCategoria={actualizarCategoria}
            />

            <Modal
                isOpen={!!eliminarConfirm}
                onClose={() => setEliminarConfirm(null)}
                title="Desactivar categoría"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-text-subtle">
                        Estás por desactivar la categoría{' '}
                        <strong className="text-text-default">{eliminarConfirm?.nombre}</strong> del catálogo.
                    </p>
                    <div className="rounded-md border border-status-warning/40 bg-status-warning/10 px-3 py-3 text-sm text-status-warning space-y-1">
                        <p className="font-medium">Información importante</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            <li>
                                Se marcará como inactiva junto con <strong>todas sus actividades</strong>.
                            </li>
                            <li>El progreso de los usuarios no se borra.</li>
                            <li>Las carreras que ya la usan la conservan.</li>
                        </ul>
                    </div>
                    <p className="text-xs text-text-muted">
                        Mientras esté inactiva no aparece para los usuarios ni suma créditos. Podés restaurarla
                        después desde esta misma lista.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setEliminarConfirm(null)}>
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={handleEliminar} loading={eliminarCategoria.isPending}>
                            Desactivar categoría
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
