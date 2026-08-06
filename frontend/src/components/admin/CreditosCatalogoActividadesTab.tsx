import { useState, useEffect } from 'react';
import { useAdminCreditosCatalogo } from '../../hooks/useAdminCreditosCatalogo';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { QueryError } from '../common/QueryError';
import { CreditoActividadModal } from './CreditoActividadModal';
import type { ActividadCredito } from '../../types/creditos.types';

type ActividadModalState = { modo: 'crear' } | { modo: 'editar'; actividad: ActividadCredito } | null;

export function CreditosCatalogoActividadesTab() {
    const {
        categorias: categoriasQuery,
        actividades: actividadesQuery,
        crearActividad,
        actualizarActividad,
        eliminarActividad,
        restaurarActividad,
    } = useAdminCreditosCatalogo();

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState(0);
    const [modal, setModal] = useState<ActividadModalState>(null);
    const [eliminarConfirm, setEliminarConfirm] = useState<ActividadCredito | null>(null);

    useEffect(() => {
        if (search === debouncedSearch) return;
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search, debouncedSearch]);

    const categorias = categoriasQuery.data ?? [];
    const actividades = actividadesQuery.data ?? [];
    const categoriasActivas = categorias.filter((c) => c.activo);

    const query = debouncedSearch.trim().toLowerCase();
    const actividadesFiltradas = actividades.filter((a) => {
        if (categoriaFiltro !== 0 && a.categoriaCreditoId !== categoriaFiltro) return false;
        if (query && !a.nombre.toLowerCase().includes(query)) return false;
        return true;
    });

    const categoriasOrdenadas = [...categorias].sort((a, b) => {
        if (a.activo !== b.activo) return a.activo ? -1 : 1;
        return a.nombre.localeCompare(b.nombre);
    });

    const grupos = categoriasOrdenadas
        .map((categoria) => ({
            categoria,
            actividades: actividadesFiltradas.filter(
                (a) => a.categoriaCreditoId === categoria.categoriaCreditoId,
            ),
        }))
        .filter((grupo) => grupo.actividades.length > 0);

    const abrirCrear = () => {
        crearActividad.reset();
        actualizarActividad.reset();
        setModal({ modo: 'crear' });
    };

    const abrirEditar = (actividad: ActividadCredito) => {
        crearActividad.reset();
        actualizarActividad.reset();
        setModal({ modo: 'editar', actividad });
    };

    const handleEliminar = () => {
        if (!eliminarConfirm) return;
        eliminarActividad.mutate(eliminarConfirm.actividadCreditoId, {
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
                        placeholder="Buscar actividades por nombre..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-10"
                    />
                </div>
                <Button size="sm" onClick={abrirCrear} disabled={categoriasActivas.length === 0}>
                    Nueva actividad
                </Button>
            </div>

            <div className="max-w-xs">
                <Select
                    label="Categoría"
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(Number(e.target.value))}
                >
                    <option value={0}>Todas las categorías</option>
                    {categoriasOrdenadas.map((c) => (
                        <option key={c.categoriaCreditoId} value={c.categoriaCreditoId}>
                            {c.nombre} {c.activo ? '' : '(inactiva)'}
                        </option>
                    ))}
                </Select>
            </div>

            {categoriasActivas.length === 0 && (
                <p className="text-sm text-text-muted">
                    Creá una categoría primero para poder agregar actividades.
                </p>
            )}

            {actividadesQuery.isLoading && <LoadingSpinner />}
            {actividadesQuery.isError && (
                <QueryError error={actividadesQuery.error} onRetry={() => actividadesQuery.refetch()} />
            )}

            <div className="space-y-5">
                {grupos.map(({ categoria, actividades: grupoActividades }) => (
                    <div key={categoria.categoriaCreditoId}>
                        <p className="label mb-2 flex items-center gap-2 normal-case">
                            <span className={categoria.activo ? 'text-accent-cyan' : 'text-text-muted'}>
                                {categoria.nombre}
                            </span>
                            <Badge variant={categoria.activo ? 'success' : 'danger'} size="sm">
                                {categoria.activo ? 'Activa' : 'Inactiva'}
                            </Badge>
                        </p>
                        <div className="space-y-2">
                            {grupoActividades.map((actividad) => (
                                <div
                                    key={actividad.actividadCreditoId}
                                    className="flex items-center gap-4 bg-bg-surface-secondary/30 border border-hairline rounded-md px-5 py-4 hover:bg-bg-surface-secondary/60 transition-colors"
                                >
                                    <div className="flex-1 min-w-0 flex items-center gap-3">
                                        <span className="text-sm font-medium text-text-default truncate">
                                            {actividad.nombre}
                                        </span>
                                        <Badge variant="info" size="sm">+{actividad.creditos} créditos</Badge>
                                        <Badge variant={actividad.activo ? 'success' : 'danger'} size="sm">
                                            {actividad.activo ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0 border-l border-hairline pl-3">
                                        <button
                                            title="Editar"
                                            onClick={() => abrirEditar(actividad)}
                                            className="p-2 text-text-muted hover:text-accent-primary hover:bg-bg-surface-secondary rounded-md transition-colors"
                                        >
                                            <Icon name="edit" className="w-4 h-4" />
                                        </button>
                                        {actividad.activo ? (
                                            <button
                                                title="Eliminar"
                                                onClick={() => setEliminarConfirm(actividad)}
                                                className="p-2 text-text-muted hover:text-status-danger hover:bg-bg-surface-secondary rounded-md transition-colors"
                                            >
                                                <Icon name="delete" className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                title="Restaurar"
                                                onClick={() => restaurarActividad.mutate(actividad.actividadCreditoId)}
                                                className="p-2 text-text-muted hover:text-accent-primary hover:bg-bg-surface-secondary rounded-md transition-colors"
                                            >
                                                <Icon name="restore" className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {grupos.length === 0 && (
                    <div className="py-8 text-center text-text-muted">No se encontraron actividades</div>
                )}
            </div>

            <CreditoActividadModal
                key={
                    modal === null
                        ? 'cerrado'
                        : modal.modo === 'crear'
                          ? 'nueva'
                          : `editar-${modal.actividad.actividadCreditoId}`
                }
                isOpen={modal !== null}
                onClose={() => setModal(null)}
                modo={modal?.modo ?? 'crear'}
                elemento={modal?.modo === 'editar' ? modal.actividad : undefined}
                categoriasActivas={categoriasActivas}
                crearActividad={crearActividad}
                actualizarActividad={actualizarActividad}
            />

            <Modal
                isOpen={!!eliminarConfirm}
                onClose={() => setEliminarConfirm(null)}
                title="Desactivar actividad"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-text-subtle">
                        Estás por desactivar la actividad{' '}
                        <strong className="text-text-default">{eliminarConfirm?.nombre}</strong> del catálogo.
                    </p>
                    <div className="rounded-md border border-status-warning/40 bg-status-warning/10 px-3 py-3 text-sm text-status-warning space-y-1">
                        <p className="font-medium">Información importante</p>
                        <ul className="list-disc list-inside space-y-0.5">
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
                        <Button variant="danger" onClick={handleEliminar} loading={eliminarActividad.isPending}>
                            Desactivar actividad
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
