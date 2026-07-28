import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { materiasAdminService, carrerasService } from '../../services/carreras.service';
import { useAdminMaterias } from '../../hooks/useAdminMaterias';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { QueryError } from '../common/QueryError';

interface Props {
    carreraId: number;
}

export function CorrelativasEditor({ carreraId }: Props) {
    const queryClient = useQueryClient();
    const [materiaId, setMateriaId] = useState(0);
    const [correlativaSel, setCorrelativaSel] = useState(0);
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
                },
            },
        );
    };

    const onEliminar = (correlativaId: number) => {
        eliminarCorrelativa.mutate(
            { materiaId, correlativaId, carreraId },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: materiaQueryKey });
                    queryClient.invalidateQueries({ queryKey: ['plan-estudios', carreraId] });
                    queryClient.invalidateQueries({ queryKey: ['carreras', 'admin'] });
                    queryClient.invalidateQueries({ queryKey: ['materias', 'admin'] });
                },
            },
        );
    };

    if (planQuery.isLoading) return <LoadingSpinner />;
    if (planQuery.isError) return <QueryError error={planQuery.error} onRetry={() => planQuery.refetch()} />;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-white">Seleccionar materia</h3>
                    {materiaId > 0 && <Badge variant="info">{correlativasExistentes.length} correlativa(s)</Badge>}
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
                                        {c.materiaCorrelativa.nombre} <span className="text-slate-400">({c.materiaCorrelativa.codigo})</span>
                                    </span>
                                    <button
                                        title="Eliminar correlativa"
                                        onClick={() => onEliminar(c.correlativaId)}
                                        className="text-slate-400 hover:text-neon-red transition-colors"
                                    >
                                        <Icon name="delete" className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </Card>

            <Card className="p-4">
                <h3 className="font-semibold text-white mb-3">Agregar correlativa</h3>
                {materiaId === 0 ? (
                    <p className="text-sm text-slate-400">Seleccioná una materia para gestionar sus correlativas.</p>
                ) : (
                    <div className="space-y-3">
                        <Select
                            label="Materia correlativa"
                            value={correlativaSel}
                            onChange={(e) => setCorrelativaSel(Number(e.target.value))}
                            disabled={posibles.length === 0}
                        >
                            <option value={0}>{posibles.length === 0 ? 'No hay materias disponibles' : 'Seleccioná una materia'}</option>
                            {posibles.map((m) => (
                                <option key={m.materiaId} value={m.materiaId}>
                                    {m.nombre} ({m.codigo})
                                </option>
                            ))}
                        </Select>
                        <Button
                            onClick={onAsignar}
                            loading={asignarCorrelativa.isPending}
                            disabled={correlativaSel === 0}
                            className="w-full"
                        >
                            Asignar correlativa
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}