import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { materiasAdminService, carrerasService } from '../../services/carreras.service';
import { useAdminMaterias } from '../../hooks/useAdminMaterias';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { QueryError } from '../common/QueryError';

interface Props {
    carreraId: number;
}

export function CorrelativasEditor({ carreraId }: Props) {
    const queryClient = useQueryClient();
    const [materiaId, setMateriaId] = useState(0);
    const [correlativaSel, setCorrelativaSel] = useState(0);
    const [agregarOpen, setAgregarOpen] = useState(false);
    const [eliminarConfirm, setEliminarConfirm] = useState<{ correlativaId: number; nombre: string; codigo: string } | null>(null);
    const materiaQueryKey = ['materia', materiaId, carreraId];

    const { asignarCorrelativa, eliminarCorrelativa } = useAdminMaterias();

    const planQuery = useQuery({
        queryKey: ['plan-estudios', carreraId],
        queryFn: () => carrerasService.obtenerPlanEstudios(carreraId),
        enabled: carreraId > 0,
    });

    const detalle = useQuery({
        queryKey: materiaQueryKey,
        queryFn: () => materiasAdminService.obtenerMateria(materiaId, carreraId),
        enabled: materiaId > 0,
    });

    const materiasDelPlan = planQuery.data?.materias ?? [];
    const correlativasExistentes = detalle.data?.correlativas ?? [];
    const posibles = materiasDelPlan.filter(
        (m) => m.materiaId !== materiaId && !correlativasExistentes.some((c) => c.materiaCorrelativaId === m.materiaId),
    );

    const onAsignar = () => {
        if (materiaId === 0 || correlativaSel === 0) return;
        asignarCorrelativa.mutate(
            { materiaId, data: { materiaCorrelativaId: correlativaSel, carreraId } },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: materiaQueryKey });
                    queryClient.invalidateQueries({ queryKey: ['plan-estudios', carreraId] });
                    queryClient.invalidateQueries({ queryKey: ['carreras', 'admin'] });
                    queryClient.invalidateQueries({ queryKey: ['materias', 'admin'] });
                    setCorrelativaSel(0);
                    setAgregarOpen(false);
                },
            },
        );
    };

    const onConfirmarEliminar = () => {
        if (!eliminarConfirm) return;
        eliminarCorrelativa.mutate(
            { materiaId, correlativaId: eliminarConfirm.correlativaId, carreraId },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: materiaQueryKey });
                    queryClient.invalidateQueries({ queryKey: ['plan-estudios', carreraId] });
                    queryClient.invalidateQueries({ queryKey: ['carreras', 'admin'] });
                    queryClient.invalidateQueries({ queryKey: ['materias', 'admin'] });
                    setEliminarConfirm(null);
                },
            },
        );
    };

    if (planQuery.isLoading) return <LoadingSpinner />;
    if (planQuery.isError) return <QueryError error={planQuery.error} onRetry={() => planQuery.refetch()} />;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4 lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-white">Seleccionar materia</h3>
                        {materiaId > 0 && <Badge variant="info">{correlativasExistentes.length} correlativa(s)</Badge>}
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setAgregarOpen(true)}
                        disabled={materiaId === 0 || posibles.length === 0}
                    >
                        Agregar correlativa
                    </Button>
                </div>
                <Select label="Materia" value={materiaId} onChange={(e) => { setMateriaId(Number(e.target.value)); setCorrelativaSel(0); }}>
                    <option value={0}>Seleccioná una materia</option>
                    {materiasDelPlan.map((m) => (
                        <option key={m.carreraMateriaId} value={m.materiaId}>
                            {m.nombre} ({m.codigo})
                        </option>
                    ))}
                </Select>

                {materiaId > 0 && (
                    <div className="mt-4">
                        {detalle.isLoading && <LoadingSpinner />}
                        {detalle.isError && <QueryError error={detalle.error} onRetry={() => detalle.refetch()} />}
                        {detalle.data && correlativasExistentes.length === 0 && (
                            <p className="text-sm text-slate-400 mt-2">Esta materia no tiene correlativas en esta carrera.</p>
                        )}
                        <ul className="space-y-2 mt-2">
                            {correlativasExistentes.map((c) => (
                                <li key={c.correlativaId} className="flex items-center justify-between bg-base-700/60 rounded-lg px-3 py-2">
                                    <span className="text-sm text-slate-200">
                                        {c.materiaCorrelativa.nombre}
                                        <Badge variant="info" size="sm" className="ml-2">{c.materiaCorrelativa.codigo}</Badge>
                                    </span>
                                    <button
                                        title="Eliminar correlativa"
                                        onClick={() => setEliminarConfirm({ correlativaId: c.correlativaId, nombre: c.materiaCorrelativa.nombre, codigo: c.materiaCorrelativa.codigo })}
                                        className="text-slate-400 hover:text-neon-red transition-colors ml-3"
                                    >
                                        <Icon name="delete" className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={agregarOpen}
                onClose={() => { setAgregarOpen(false); asignarCorrelativa.reset(); }}
                title="Agregar correlativa"
                size="md"
            >
                {materiaId === 0 ? (
                    <p className="text-sm text-slate-400">Seleccioná una materia para gestionar sus correlativas.</p>
                ) : (
                    <div className="space-y-4">
                        <div className="p-3 bg-base-800/50 rounded-lg border border-base-600">
                            <p className="text-sm font-medium text-slate-300 mb-1">Materia seleccionada</p>
                            <p className="text-white">{materiasDelPlan.find((m) => m.materiaId === materiaId)?.nombre}</p>
                        </div>
                        {posibles.length === 0 ? (
                            <p className="text-sm text-slate-400">No hay materias disponibles para asignar como correlativas.</p>
                        ) : (
                            <Select
                                label="Materia correlativa"
                                value={correlativaSel}
                                onChange={(e) => setCorrelativaSel(Number(e.target.value))}
                            >
                                <option value={0}>Seleccioná una materia</option>
                                {posibles.map((m) => (
                                    <option key={m.materiaId} value={m.materiaId}>
                                        {m.nombre} ({m.codigo})
                                    </option>
                                ))}
                            </Select>
                        )}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={() => { setAgregarOpen(false); asignarCorrelativa.reset(); }}>
                                Cancelar
                            </Button>
                            <Button onClick={onAsignar} loading={asignarCorrelativa.isPending} disabled={correlativaSel === 0 || posibles.length === 0}>
                                Asignar correlativa
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={!!eliminarConfirm}
                onClose={() => { setEliminarConfirm(null); eliminarCorrelativa.reset(); }}
                title="Eliminar correlativa"
                size="md"
            >
                {eliminarConfirm && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 flex-wrap bg-base-700/60 rounded-lg px-3 py-2">
                            <span className="text-sm text-slate-200">
                                {eliminarConfirm.nombre}
                                <Badge variant="info" size="sm" className="ml-2">{eliminarConfirm.codigo}</Badge>
                            </span>
                        </div>
                        <p className="text-sm text-slate-300">
                            Estás por eliminar esta materia como correlativa. Los estudiantes podrán cursar la materia seleccionada sin haberla aprobado.
                        </p>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={() => { setEliminarConfirm(null); eliminarCorrelativa.reset(); }}>Cancelar</Button>
                            <Button
                                variant="danger"
                                onClick={onConfirmarEliminar}
                                loading={eliminarCorrelativa.isPending}
                            >
                                Eliminar correlativa
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
