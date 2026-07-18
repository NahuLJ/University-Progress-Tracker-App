import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carrerasService, materiasAdminService } from '../../services/carreras.service';
import { useAdminCarreras } from '../../hooks/useAdminCarreras';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { QueryError } from '../common/QueryError';
import type { AgregarMateriaPlanDto } from '../../types/carrera.types';

export function PlanEstudiosAdmin() {
    const queryClient = useQueryClient();
    const [carreraId, setCarreraId] = useState<number>(0);

    const carreras = useQuery({
        queryKey: ['carreras', 'disponibles'],
        queryFn: () => carrerasService.obtenerCarrerasDisponibles(),
    });

    const plan = useQuery({
        queryKey: ['plan-estudios', carreraId],
        queryFn: () => carrerasService.obtenerPlanEstudios(carreraId),
        enabled: carreraId > 0,
    });

    const catalogo = useQuery({
        queryKey: ['materias', 'catalogo'],
        queryFn: () => materiasAdminService.listarMaterias(),
    });

    const { agregarMateriaAlPlan } = useAdminCarreras();

    const [materiaId, setMateriaId] = useState<number>(0);
    const [anio, setAnio] = useState<number>(1);
    const [cuatrimestre, setCuatrimestre] = useState<number>(1);
    const [orden, setOrden] = useState<number>(1);

    const materiasEnPlan = plan.data?.materias ?? [];
    const disponibles =
        catalogo.data?.filter((m) => !materiasEnPlan.some((p) => p.materiaId === m.materiaId)) ?? [];

    const agregarMutation = useMutation({
        mutationFn: (data: AgregarMateriaPlanDto) =>
            agregarMateriaAlPlan.mutateAsync({ carreraId, data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plan-estudios', carreraId] });
            setMateriaId(0);
            setAnio(1);
            setCuatrimestre(1);
            setOrden(1);
        },
    });

    if (carreras.isLoading) return <LoadingSpinner />;
    if (carreras.isError)
        return <QueryError error={carreras.error} onRetry={() => carreras.refetch()} />;

    return (
        <div className="space-y-6">
            <Select
                label="Carrera"
                value={carreraId}
                onChange={(e) => setCarreraId(Number(e.target.value))}
            >
                <option value={0}>Seleccioná una carrera</option>
                {carreras.data?.map((c) => (
                    <option key={c.carreraId} value={c.carreraId}>
                        {c.nombre}
                    </option>
                ))}
            </Select>

            {carreraId > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Materias en el plan</h3>
                        {plan.isLoading && <LoadingSpinner />}
                        {plan.isError && (
                            <QueryError error={plan.error} onRetry={() => plan.refetch()} />
                        )}
                        {plan.data && materiasEnPlan.length === 0 && (
                            <p className="text-sm text-gray-500">Esta carrera aún no tiene materias en su plan.</p>
                        )}
                        {plan.data && plan.data.anios.length > 0 && (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {plan.data.anios.map((anioData) => (
                                    <div key={anioData.anio}>
                                        <h4 className="text-sm font-medium text-gray-700">
                                            Año {anioData.anio}
                                        </h4>
                                        {anioData.cuatrimestres.map((cuat) => (
                                            <div key={cuat.cuatrimestre} className="ml-3 mt-1">
                                                <p className="text-xs text-gray-500">
                                                    Cuatrimestre {cuat.cuatrimestre}
                                                </p>
                                                <ul className="list-disc list-inside text-sm text-gray-800">
                                                    {cuat.materias.map((m) => (
                                                        <li key={m.carreraMateriaId}>
                                                            {m.nombre}{' '}
                                                            <span className="text-gray-400">({m.codigo})</span>
                                                            {m.correlativas.length > 0 && (
                                                                <span className="text-gray-400">
                                                                    {' '}
                                                                    · {m.correlativas.length} corr.
                                                                </span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Agregar materia al plan</h3>
                        <div className="space-y-3">
                            <Select
                                label="Materia"
                                value={materiaId}
                                onChange={(e) => setMateriaId(Number(e.target.value))}
                                disabled={catalogo.isLoading}
                            >
                                <option value={0}>
                                    {catalogo.isLoading ? 'Cargando...' : 'Seleccioná una materia'}
                                </option>
                                {disponibles.map((m) => (
                                    <option key={m.materiaId} value={m.materiaId}>
                                        {m.nombre} ({m.codigo})
                                    </option>
                                ))}
                            </Select>
                            <div className="grid grid-cols-3 gap-3">
                                <Input
                                    label="Año"
                                    type="number"
                                    min={1}
                                    value={anio}
                                    onChange={(e) => setAnio(Number(e.target.value))}
                                />
                                <Input
                                    label="Cuatrimestre"
                                    type="number"
                                    min={1}
                                    value={cuatrimestre}
                                    onChange={(e) => setCuatrimestre(Number(e.target.value))}
                                />
                                <Input
                                    label="Orden"
                                    type="number"
                                    min={1}
                                    value={orden}
                                    onChange={(e) => setOrden(Number(e.target.value))}
                                />
                            </div>

                            {agregarMutation.isError && (
                                <Alert variant="error">
                                    No se pudo agregar la materia. Podría estar ya en el plan.
                                </Alert>
                            )}

                            <Button
                                onClick={() =>
                                    agregarMutation.mutate({ materiaId, anio, cuatrimestre, orden })
                                }
                                loading={agregarMutation.isPending}
                                disabled={materiaId === 0}
                                className="w-full"
                            >
                                Agregar al plan
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
