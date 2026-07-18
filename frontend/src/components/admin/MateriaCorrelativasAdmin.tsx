import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { materiasAdminService } from '../../services/carreras.service';
import { useAdminMaterias } from '../../hooks/useAdminMaterias';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { QueryError } from '../common/QueryError';
import { Badge } from '../ui/Badge';

export function MateriaCorrelativasAdmin() {
    const queryClient = useQueryClient();
    const [materiaId, setMateriaId] = useState<number>(0);
    const [correlativaId, setCorrelativaId] = useState<number>(0);

    const { listarMaterias, asignarCorrelativa, eliminarCorrelativa } = useAdminMaterias();

    const detalle = useQuery({
        queryKey: ['materia', materiaId],
        queryFn: () => materiasAdminService.obtenerMateria(materiaId),
        enabled: materiaId > 0,
    });

    if (listarMaterias.isLoading) return <LoadingSpinner />;
    if (listarMaterias.isError)
        return (
            <QueryError
                error={listarMaterias.error}
                onRetry={() => listarMaterias.refetch()}
            />
        );

    const todasMaterias = listarMaterias.data ?? [];
    const correlativasExistentes = detalle.data?.correlativas ?? [];
    const posibles = todasMaterias.filter(
        (m) => m.materiaId !== materiaId && !correlativasExistentes.some((c) => c.materiaCorrelativaId === m.materiaId),
    );

    const onAsignar = () => {
        if (materiaId === 0 || correlativaId === 0) return;
        asignarCorrelativa.mutate(
            { materiaId, data: { materiaCorrelativaId: correlativaId } },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['materia', materiaId] });
                    queryClient.invalidateQueries({ queryKey: ['materias', 'catalogo'] });
                    setCorrelativaId(0);
                },
            },
        );
    };

    const onEliminar = (cid: number) => {
        eliminarCorrelativa.mutate(
            { materiaId, correlativaId: cid },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['materia', materiaId] });
                },
            },
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Seleccionar materia</h3>
                <Select
                    label="Materia"
                    value={materiaId}
                    onChange={(e) => setMateriaId(Number(e.target.value))}
                >
                    <option value={0}>Seleccioná una materia</option>
                    {todasMaterias.map((m) => (
                        <option key={m.materiaId} value={m.materiaId}>
                            {m.nombre} ({m.codigo})
                        </option>
                    ))}
                </Select>

                {materiaId > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Correlativas actuales</h4>
                        {detalle.isLoading && <LoadingSpinner />}
                        {detalle.isError && (
                            <QueryError
                                error={detalle.error}
                                onRetry={() => detalle.refetch()}
                            />
                        )}
                        {detalle.data && correlativasExistentes.length === 0 && (
                            <p className="text-sm text-gray-500">Esta materia no tiene correlativas.</p>
                        )}
                        <ul className="space-y-2">
                            {correlativasExistentes.map((c) => (
                                <li
                                    key={c.correlativaId}
                                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                                >
                                    <span className="text-sm text-gray-800">
                                        {c.materiaCorrelativa.nombre}{' '}
                                        <span className="text-gray-400">
                                            ({c.materiaCorrelativa.codigo})
                                        </span>
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEliminar(c.correlativaId)}
                                        loading={
                                            eliminarCorrelativa.isPending &&
                                            eliminarCorrelativa.variables?.correlativaId === c.correlativaId
                                        }
                                    >
                                        Quitar
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </Card>

            <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Agregar correlativa</h3>
                {materiaId === 0 ? (
                    <p className="text-sm text-gray-500">Seleccioná una materia para gestionar sus correlativas.</p>
                ) : (
                    <div className="space-y-3">
                        <Select
                            label="Materia correlativa"
                            value={correlativaId}
                            onChange={(e) => setCorrelativaId(Number(e.target.value))}
                            disabled={posibles.length === 0}
                        >
                            <option value={0}>
                                {posibles.length === 0 ? 'No hay materias disponibles' : 'Seleccioná una materia'}
                            </option>
                            {posibles.map((m) => (
                                <option key={m.materiaId} value={m.materiaId}>
                                    {m.nombre} ({m.codigo})
                                </option>
                            ))}
                        </Select>

                        {asignarCorrelativa.isError && (
                            <Alert variant="error">
                                No se pudo asignar la correlativa. Podría ser duplicada o auto-referencial.
                            </Alert>
                        )}

                        <Button
                            onClick={onAsignar}
                            loading={asignarCorrelativa.isPending}
                            disabled={correlativaId === 0}
                            className="w-full"
                        >
                            Asignar correlativa
                        </Button>

                        {correlativasExistentes.length > 0 && (
                            <div className="pt-2">
                                <Badge variant="info">{correlativasExistentes.length} correlativa(s)</Badge>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}
