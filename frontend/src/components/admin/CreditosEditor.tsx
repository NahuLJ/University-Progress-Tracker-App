import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../../utils/cn';
import { useAdminCreditos } from '../../hooks/useAdminCreditos';
import { carrerasService } from '../../services/carreras.service';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { QueryError } from '../common/QueryError';

interface Props {
    carreraId: number;
}

export function CreditosEditor({ carreraId }: Props) {
    const {
        config,
        categorias,
        actividades,
        actualizarSistema,
        crearCategoria,
        agregarCategoria,
        actualizarCategoria,
        quitarCategoria,
        crearActividad,
        agregarActividad,
        quitarActividad,
    } = useAdminCreditos(carreraId);

    const planEstudios = useQuery({
        queryKey: ['plan-estudios', carreraId],
        queryFn: () => carrerasService.obtenerPlanEstudios(carreraId),
        enabled: carreraId > 0,
    });

    const [habilitado, setHabilitado] = useState(false);
    const [totalCreditos, setTotalCreditos] = useState('');
    const [minimosEdicion, setMinimosEdicion] = useState<Record<number, string>>({});

    const [agregarCatOpen, setAgregarCatOpen] = useState(false);
    const [catModo, setCatModo] = useState<'existente' | 'nueva'>('existente');
    const [catSeleccion, setCatSeleccion] = useState(0);
    const [catMinimo, setCatMinimo] = useState('1');
    const [catNuevoNombre, setCatNuevoNombre] = useState('');
    const [catNuevaDescripcion, setCatNuevaDescripcion] = useState('');

    const [agregarActOpen, setAgregarActOpen] = useState(false);
    const [actModo, setActModo] = useState<'existente' | 'nueva'>('existente');
    const [actCategoriaId, setActCategoriaId] = useState(0);
    const [actSeleccion, setActSeleccion] = useState(0);
    const [actNombre, setActNombre] = useState('');
    const [actDescripcion, setActDescripcion] = useState('');
    const [actCreditos, setActCreditos] = useState('1');
    const [actRequisitos, setActRequisitos] = useState<number[]>([]);

    const [quitarCatConfirm, setQuitarCatConfirm] = useState<{ id: number; nombre: string } | null>(null);
    const [quitarActConfirm, setQuitarActConfirm] = useState<{ id: number; nombre: string } | null>(null);

    useEffect(() => {
        if (!config.data) return;
        setHabilitado(config.data.sistemaCreditos);
        if (config.data.totalCreditos > 0) {
            setTotalCreditos(String(config.data.totalCreditos));
        }
        const minimos: Record<number, string> = {};
        for (const c of config.data.categorias) {
            minimos[c.carreraCategoriaCreditoId] = String(c.minimoCreditos);
        }
        setMinimosEdicion(minimos);
    }, [config.data]);

    if (config.isLoading || planEstudios.isLoading) return <LoadingSpinner />;
    if (config.isError) {
        return <QueryError error={config.error} onRetry={() => config.refetch()} />;
    }

    const sistema = config.data!;
    const categoriasCatalogo = categorias.data ?? [];
    const actividadesCatalogo = actividades.data ?? [];
    const materiasPlan = planEstudios.data?.materias ?? [];

    const sumaMinimos = sistema.categorias.reduce((s, c) => s + c.minimoCreditos, 0);
    const totalValido = Number(totalCreditos);
    const cumplimientoOk = !habilitado || (totalValido > 0 && sumaMinimos <= totalValido);

    const onToggleSistema = () => {
        if (habilitado) {
            setHabilitado(false);
            actualizarSistema.mutate({ creditosHabilitado: false });
        } else {
            setHabilitado(true);
        }
    };

    const onGuardarSistema = () => {
        const total = Number(totalCreditos);
        if (!total || total <= 0) return;
        actualizarSistema.mutate({ creditosHabilitado: true, totalCreditos: total });
    };

    const categoriasDisponibles = categoriasCatalogo.filter(
        (c) =>
            c.activo &&
            !sistema.categorias.some((cc) => cc.categoriaCreditoId === c.categoriaCreditoId),
    );

    const actividadesDisponibles = actividadesCatalogo.filter(
        (a) =>
            a.activo &&
            a.categoriaCreditoId === actCategoriaId &&
            !sistema.actividades.some((ca) => ca.actividadCreditoId === a.actividadCreditoId),
    );

    const resetCategoriaModal = () => {
        setAgregarCatOpen(false);
        setCatModo('existente');
        setCatSeleccion(0);
        setCatMinimo('1');
        setCatNuevoNombre('');
        setCatNuevaDescripcion('');
        crearCategoria.reset();
        agregarCategoria.reset();
    };

    const onAgregarCategoria = async () => {
        const minimo = Number(catMinimo);
        if (!Number.isInteger(minimo) || minimo < 0) return;
        if (catModo === 'nueva' && !catNuevoNombre.trim()) return;
        try {
            if (catModo === 'nueva') {
                const creada = await crearCategoria.mutateAsync({
                    nombre: catNuevoNombre.trim(),
                    descripcion: catNuevaDescripcion || undefined,
                });
                await agregarCategoria.mutateAsync({
                    categoriaCreditoId: creada.categoriaCreditoId,
                    minimoCreditos: minimo,
                });
            } else {
                await agregarCategoria.mutateAsync({
                    categoriaCreditoId: catSeleccion,
                    minimoCreditos: minimo,
                });
            }
            resetCategoriaModal();
        } catch {
            // notificaciones en las mutations
        }
    };

    const resetActividadModal = () => {
        setAgregarActOpen(false);
        setActModo('existente');
        setActCategoriaId(0);
        setActSeleccion(0);
        setActNombre('');
        setActDescripcion('');
        setActCreditos('1');
        setActRequisitos([]);
        crearActividad.reset();
        agregarActividad.reset();
    };

    const onAgregarActividad = async () => {
        if (!actCategoriaId) return;
        try {
            if (actModo === 'nueva') {
                const creditos = Number(actCreditos);
                if (!Number.isInteger(creditos) || creditos <= 0 || !actNombre.trim()) return;
                const creada = await crearActividad.mutateAsync({
                    nombre: actNombre.trim(),
                    descripcion: actDescripcion || undefined,
                    categoriaCreditoId: actCategoriaId,
                    creditos,
                    materiasRequeridas: actRequisitos.length > 0 ? actRequisitos : undefined,
                });
                await agregarActividad.mutateAsync(creada.actividadCreditoId);
            } else {
                await agregarActividad.mutateAsync(actSeleccion);
            }
            resetActividadModal();
        } catch {
            // notificaciones en las mutations
        }
    };

    const onGuardarMinimo = (carreraCategoriaCreditoId: number) => {
        const minimo = Number(minimosEdicion[carreraCategoriaCreditoId]);
        if (!Number.isInteger(minimo) || minimo < 0) return;
        actualizarCategoria.mutate({ carreraCategoriaCreditoId, minimoCreditos: minimo });
    };

    const actividadesPorCategoria = new Map<string, typeof sistema.actividades>();
    for (const a of sistema.actividades) {
        const lista = actividadesPorCategoria.get(a.categoriaNombre) ?? [];
        lista.push(a);
        actividadesPorCategoria.set(a.categoriaNombre, lista);
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="p-6">
                    <h2 className="text-sm font-semibold text-text-default mb-1 border-l-2 border-accent-primary pl-3">
                        Sistema de créditos por actividades
                    </h2>
                    <p className="text-sm text-text-muted mb-4 pl-3">
                        Créditos que se suman al completar actividades (seminarios, proyectos, etc.)
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onToggleSistema}
                                aria-pressed={habilitado}
                                className={cn(
                                    'w-11 h-6 rounded-full transition-colors relative shrink-0',
                                    habilitado
                                        ? 'bg-accent-primary'
                                        : 'bg-bg-surface-secondary border border-hairline',
                                )}
                            >
                                <span
                                    className={cn(
                                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                                        habilitado && 'translate-x-5',
                                    )}
                                />
                            </button>
                            <span className="text-sm font-medium text-text-default">
                                {habilitado ? 'Sistema activado' : 'Sistema desactivado'}
                            </span>
                        </div>
                        {habilitado && (
                            <div className="flex items-end gap-3">
                                <div className="w-40">
                                    <Input
                                        label="Total de créditos requeridos"
                                        type="number"
                                        min={1}
                                        value={totalCreditos}
                                        onChange={(e) => setTotalCreditos(e.target.value)}
                                    />
                                </div>
                                <Button onClick={onGuardarSistema} loading={actualizarSistema.isPending}>
                                    Guardar total
                                </Button>
                            </div>
                        )}
                    </div>

                    {habilitado && !cumplimientoOk && (
                        <div className="rounded-md border border-status-danger/40 bg-status-danger/10 px-3 py-2 text-sm text-status-danger mb-4">
                            La suma de mínimos por categoría ({sumaMinimos}) supera el total de créditos (
                            {totalValido || '?'}). Ajustá el total o los mínimos.
                        </div>
                    )}
                    {habilitado && cumplimientoOk && totalValido > 0 && (
                        <div className="rounded-md border border-status-success/40 bg-status-success/10 px-3 py-2 text-sm text-status-success mb-4">
                            Suma de mínimos ({sumaMinimos}) ≤ total ({totalValido}) ✓
                        </div>
                    )}

                    <p className="text-xs text-text-muted">
                        Las categorías y actividades se comparten entre todas las carreras. La configuración de
                        esta carrera (mínimos y actividades incluidas) es propia.
                    </p>
                </div>
            </Card>

            <Card>
                <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-text-default border-l-2 border-accent-primary pl-3">
                            Categorías
                        </h2>
                        <p className="text-sm text-text-muted mt-1 pl-3">Mínimos exigidos por categoría</p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setAgregarCatOpen(true)}
                        disabled={!habilitado}
                    >
                        Agregar categoría
                    </Button>
                </div>

                {!habilitado ? (
                    <div className="px-6 pb-6 text-sm text-text-muted">
                        Activá el sistema de créditos para configurar categorías y actividades.
                    </div>
                ) : sistema.categorias.length === 0 ? (
                    <div className="px-6 pb-6 text-sm text-text-muted">
                        No hay categorías configuradas todavía.
                    </div>
                ) : (
                    <div className="px-6 pb-6 space-y-3">
                        {sistema.categorias.map((c) => (
                            <div
                                key={c.carreraCategoriaCreditoId}
                                className="flex items-center justify-between gap-4 bg-bg-surface-secondary/60 rounded-md px-3 py-2"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <Icon name="circle" className="w-4 h-4 text-accent-cyan shrink-0" />
                                    <span className="text-sm font-medium text-text-default truncate">
                                        {c.nombre}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        className="w-24 text-right"
                                        type="number"
                                        min={0}
                                        value={minimosEdicion[c.carreraCategoriaCreditoId] ?? String(c.minimoCreditos)}
                                        onChange={(e) =>
                                            setMinimosEdicion((prev) => ({
                                                ...prev,
                                                [c.carreraCategoriaCreditoId]: e.target.value,
                                            }))
                                        }
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onGuardarMinimo(c.carreraCategoriaCreditoId)}
                                        loading={actualizarCategoria.isPending}
                                    >
                                        Mínimo
                                    </Button>
                                    <button
                                        title="Quitar categoría"
                                        onClick={() =>
                                            setQuitarCatConfirm({ id: c.carreraCategoriaCreditoId, nombre: c.nombre })
                                        }
                                        className="text-text-muted hover:text-status-danger transition-colors ml-1"
                                    >
                                        <Icon name="delete" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card>
                <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-text-default border-l-2 border-accent-primary pl-3">
                            Actividades
                        </h2>
                        <p className="text-sm text-text-muted mt-1 pl-3">
                            Actividades que aportan créditos al completarse
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setAgregarActOpen(true)}
                        disabled={!habilitado || sistema.categorias.length === 0}
                    >
                        Agregar actividad
                    </Button>
                </div>

                {!habilitado ? (
                    <div className="px-6 pb-6 text-sm text-text-muted">
                        Activá el sistema de créditos para configurar categorías y actividades.
                    </div>
                ) : sistema.actividades.length === 0 ? (
                    <div className="px-6 pb-6 text-sm text-text-muted">
                        No hay actividades incluidas en el sistema de esta carrera.
                    </div>
                ) : (
                    <div className="px-6 pb-6 space-y-5">
                        {[...actividadesPorCategoria.entries()].map(([categoriaNombre, lista]) => (
                            <div key={categoriaNombre}>
                                <p className="label mb-2 text-accent-cyan">{categoriaNombre}</p>
                                <div className="space-y-2">
                                    {lista.map((a) => (
                                        <div
                                            key={a.carreraActividadCreditoId}
                                            className="flex items-center justify-between gap-4 bg-bg-surface-secondary/60 rounded-md px-3 py-2"
                                        >
                                            <div className="min-w-0">
                                                <span className="text-sm text-text-default">{a.nombre}</span>
                                                <Badge variant="info" size="sm" className="ml-2">
                                                    +{a.creditos} cr
                                                </Badge>
                                                {a.materiasRequeridas.length > 0 && (
                                                    <span className="flex flex-wrap items-center gap-1 mt-1.5">
                                                        <span className="text-xs text-text-muted">Requisitos:</span>
                                                        {a.materiasRequeridas.map((m) => (
                                                            <Badge key={m.materiaId} size="sm">
                                                                {m.codigo}
                                                            </Badge>
                                                        ))}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                title="Quitar actividad"
                                                onClick={() =>
                                                    setQuitarActConfirm({
                                                        id: a.carreraActividadCreditoId,
                                                        nombre: a.nombre,
                                                    })
                                                }
                                                className="text-text-muted hover:text-status-danger transition-colors shrink-0"
                                            >
                                                <Icon name="delete" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Modal isOpen={agregarCatOpen} onClose={resetCategoriaModal} title="Agregar categoría" size="lg">
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setCatModo('existente')}
                            className={cn(
                                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                                catModo === 'existente'
                                    ? 'bg-accent-primary text-accent-foreground'
                                    : 'bg-transparent border border-hairline text-text-muted hover:text-text-default',
                            )}
                        >
                            Usar categoría existente
                        </button>
                        <button
                            type="button"
                            onClick={() => setCatModo('nueva')}
                            className={cn(
                                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                                catModo === 'nueva'
                                    ? 'bg-accent-primary text-accent-foreground'
                                    : 'bg-transparent border border-hairline text-text-muted hover:text-text-default',
                            )}
                        >
                            Crear nueva
                        </button>
                    </div>

                    {catModo === 'existente' ? (
                        categoriasDisponibles.length === 0 ? (
                            <p className="text-sm text-text-muted">
                                No hay categorías disponibles (todas las existentes ya están en el sistema).
                            </p>
                        ) : (
                            <Select
                                label="Categoría"
                                value={catSeleccion}
                                onChange={(e) => setCatSeleccion(Number(e.target.value))}
                            >
                                <option value={0}>Seleccioná una categoría</option>
                                {categoriasDisponibles.map((c) => (
                                    <option key={c.categoriaCreditoId} value={c.categoriaCreditoId}>
                                        {c.nombre}
                                    </option>
                                ))}
                            </Select>
                        )
                    ) : (
                        <>
                            <Input
                                label="Nombre de la nueva categoría"
                                value={catNuevoNombre}
                                onChange={(e) => setCatNuevoNombre(e.target.value)}
                                placeholder="Ej. Seminarios"
                            />
                            <Input
                                label="Descripción (opcional)"
                                value={catNuevaDescripcion}
                                onChange={(e) => setCatNuevaDescripcion(e.target.value)}
                            />
                        </>
                    )}

                    <Input
                        label="Mínimo de créditos requerido en la categoría"
                        type="number"
                        min={0}
                        value={catMinimo}
                        onChange={(e) => setCatMinimo(e.target.value)}
                    />

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={resetCategoriaModal}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={onAgregarCategoria}
                            loading={crearCategoria.isPending || agregarCategoria.isPending}
                            disabled={
                                (catModo === 'existente' && (catSeleccion === 0 || categoriasDisponibles.length === 0)) ||
                                (catModo === 'nueva' && !catNuevoNombre.trim())
                            }
                        >
                            Agregar categoría
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={agregarActOpen} onClose={resetActividadModal} title="Agregar actividad" size="xl">
                <div className="space-y-4">
                    <Select
                        label="Categoría (de las del sistema de la carrera)"
                        value={actCategoriaId}
                        onChange={(e) => {
                            setActCategoriaId(Number(e.target.value));
                            setActSeleccion(0);
                        }}
                    >
                        <option value={0}>Seleccioná una categoría</option>
                        {sistema.categorias.map((c) => (
                            <option key={c.carreraCategoriaCreditoId} value={c.categoriaCreditoId}>
                                {c.nombre}
                            </option>
                        ))}
                    </Select>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setActModo('existente')}
                            className={cn(
                                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                                actModo === 'existente'
                                    ? 'bg-accent-primary text-accent-foreground'
                                    : 'bg-transparent border border-hairline text-text-muted hover:text-text-default',
                            )}
                        >
                            Usar actividad existente
                        </button>
                        <button
                            type="button"
                            onClick={() => setActModo('nueva')}
                            className={cn(
                                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                                actModo === 'nueva'
                                    ? 'bg-accent-primary text-accent-foreground'
                                    : 'bg-transparent border border-hairline text-text-muted hover:text-text-default',
                            )}
                        >
                            Crear nueva
                        </button>
                    </div>

                    {actModo === 'existente' ? (
                        actCategoriaId === 0 ? (
                            <p className="text-sm text-text-muted">Seleccioná primero la categoría.</p>
                        ) : actividadesDisponibles.length === 0 ? (
                            <p className="text-sm text-text-muted">
                                No hay actividades disponibles en esa categoría (todas las existentes ya están
                                incluidas).
                            </p>
                        ) : (
                            <Select
                                label="Actividad"
                                value={actSeleccion}
                                onChange={(e) => setActSeleccion(Number(e.target.value))}
                            >
                                <option value={0}>Seleccioná una actividad</option>
                                {actividadesDisponibles.map((a) => (
                                    <option key={a.actividadCreditoId} value={a.actividadCreditoId}>
                                        {a.nombre} (+{a.creditos} cr)
                                    </option>
                                ))}
                            </Select>
                        )
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombre"
                                value={actNombre}
                                onChange={(e) => setActNombre(e.target.value)}
                                placeholder="Ej. Taller de liderazgo"
                            />
                            <Input
                                label="Créditos que aporta"
                                type="number"
                                min={1}
                                value={actCreditos}
                                onChange={(e) => setActCreditos(e.target.value)}
                            />
                            <div className="md:col-span-2">
                                <Input
                                    label="Descripción (opcional)"
                                    value={actDescripcion}
                                    onChange={(e) => setActDescripcion(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {actModo === 'nueva' && (
                        <div>
                            <p className="label mb-1">Materias requisito (opcional)</p>
                            <p className="text-xs text-text-muted mb-2">
                                Para completar la actividad hay que tener aprobadas estas materias. Vacío = se
                                completa directamente.
                            </p>
                            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-hairline rounded-md p-2">
                                {materiasPlan.map((m) => (
                                    <label
                                        key={m.materiaId}
                                        className="flex items-center gap-2 text-sm text-text-default cursor-pointer hover:bg-bg-surface-secondary rounded px-1 py-0.5"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={actRequisitos.includes(m.materiaId)}
                                            onChange={(e) =>
                                                setActRequisitos((prev) =>
                                                    e.target.checked
                                                        ? [...prev, m.materiaId]
                                                        : prev.filter((id) => id !== m.materiaId),
                                                )
                                            }
                                            className="accent-accent-cyan"
                                        />
                                        <span className="truncate">{m.nombre}</span>
                                        <Badge variant="info" size="sm" className="ml-auto shrink-0">
                                            {m.codigo}
                                        </Badge>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={resetActividadModal}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={onAgregarActividad}
                            loading={crearActividad.isPending || agregarActividad.isPending}
                            disabled={
                                actCategoriaId === 0 ||
                                (actModo === 'existente' && actSeleccion === 0) ||
                                (actModo === 'nueva' &&
                                    (!actNombre.trim() || !Number.isInteger(Number(actCreditos)) || Number(actCreditos) <= 0))
                            }
                        >
                            Agregar actividad
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!quitarCatConfirm}
                onClose={() => setQuitarCatConfirm(null)}
                title="Quitar categoría"
                size="md"
            >
                <div className="space-y-4">
                    <p>
                        ¿Querés quitar la categoría <strong>{quitarCatConfirm?.nombre}</strong> del sistema de la
                        carrera? Se quitarán también sus actividades de esta carrera. El catálogo global no se borra.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setQuitarCatConfirm(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                if (quitarCatConfirm) quitarCategoria.mutate(quitarCatConfirm.id);
                                setQuitarCatConfirm(null);
                            }}
                            loading={quitarCategoria.isPending}
                        >
                            Quitar categoría
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!quitarActConfirm}
                onClose={() => setQuitarActConfirm(null)}
                title="Quitar actividad"
                size="md"
            >
                <div className="space-y-4">
                    <p>
                        ¿Querés quitar la actividad <strong>{quitarActConfirm?.nombre}</strong> del sistema de la
                        carrera? El catálogo global y el progreso de los usuarios no se borran.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setQuitarActConfirm(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                if (quitarActConfirm) quitarActividad.mutate(quitarActConfirm.id);
                                setQuitarActConfirm(null);
                            }}
                            loading={quitarActividad.isPending}
                        >
                            Quitar actividad
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
