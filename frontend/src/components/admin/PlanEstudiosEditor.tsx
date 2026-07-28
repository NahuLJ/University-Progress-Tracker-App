import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carrerasService, materiasAdminService } from '../../services/carreras.service';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { QueryError } from '../common/QueryError';
import type { AgregarMateriaPlanDto } from '../../types/carrera.types';

interface Props {
    carreraId: number;
}

export function PlanEstudiosEditor({ carreraId }: Props) {
    const queryClient = useQueryClient();
    const [materiaId, setMateriaId] = useState(0);
    const [anio, setAnio] = useState(1);
    const [cuatrimestre, setCuatrimestre] = useState(1);
    const [orden, setOrden] = useState(1);
    const [quitarConfirm, setQuitarConfirm] = useState<{ carreraMateriaId: number; nombre: string; codigo: string } | null>(null);

    const plan = useQuery({
        queryKey: ['plan-estudios', carreraId],
        queryFn: () => carrerasService.obtenerPlanEstudios(carreraId),
        enabled: carreraId > 0,
    });

    const catalogo = useQuery({
        queryKey: ['materias', 'catalogo'],
        queryFn: () => materiasAdminService.listarMateriasAdmin({ page: 1, limit: 200 }),
    });

    const agregarMutation = useMutation({
        mutationFn: (data: AgregarMateriaPlanDto) =>
            carrerasService.agregarMateriaAlPlan(carreraId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plan-estudios', carreraId] });
            setMateriaId(0);
            setAnio(1);
            setCuatrimestre(1);
            setOrden(1);
        },
    });

    const quitarMutation = useMutation({
        mutationFn: (carreraMateriaId: number) =>
            carrerasService.quitarMateriaDelPlan(carreraId, carreraMateriaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plan-estudios', carreraId] });
            setQuitarConfirm(null);
        },
    });

    const materiasEnPlan = plan.data?.materias ?? [];
    const disponibles = (catalogo.data?.data ?? []).filter(
        (m) => !materiasEnPlan.some((p) => p.materiaId === m.materiaId),
    );
    const totalMaterias = materiasEnPlan.length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-white">Materias en el plan</h3>
                    <Badge variant="info">{totalMaterias}</Badge>
                </div>
                {plan.isLoading && <LoadingSpinner />}
                {plan.isError && <QueryError error={plan.error} onRetry={() => plan.refetch()} />}
                {plan.data && totalMaterias === 0 && (
                    <p className="text-sm text-slate-400">Esta carrera aún no tiene materias en su plan.</p>
                )}
                {plan.data && plan.data.anios.length > 0 && (
                    <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
                        {plan.data.anios.map((anioData) => (
                            <div key={anioData.anio}>
                                <h4 className="text-sm font-medium text-neon-cyan">Año {anioData.anio}</h4>
                                {anioData.cuatrimestres.map((cuat) => (
                                    <div key={cuat.cuatrimestre} className="ml-3 mt-1">
                                        <p className="text-xs text-slate-400">Cuatrimestre {cuat.cuatrimestre}</p>
                                        <ul className="space-y-1 mt-1">
                                            {cuat.materias.map((m) => (
                                                <li key={m.carreraMateriaId}
                                                    className="flex items-center justify-between bg-base-700/60 rounded-lg px-3 py-2"
                                                >
                                                    <span className="text-sm text-slate-200">
                                                        {m.nombre} <span className="text-slate-500">(orden {m.orden})</span> <span className="text-slate-400">({m.codigo})</span>
                                                    </span>
                                                    <button
                                                        title="Quitar del plan"
                                                        onClick={() => setQuitarConfirm({ carreraMateriaId: m.carreraMateriaId, nombre: m.nombre, codigo: m.codigo })}
                                                        className="text-slate-400 hover:text-neon-red transition-colors"
                                                    >
                                                        <Icon name="delete" className="w-4 h-4" />
                                                    </button>
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
                <h3 className="font-semibold text-white mb-3">Agregar materia al plan</h3>
                <div className="space-y-3">
                    <Select
                        label="Materia"
                        value={materiaId}
                        onChange={(e) => setMateriaId(Number(e.target.value))}
                        disabled={catalogo.isLoading}
                    >
                        <option value={0}>{catalogo.isLoading ? 'Cargando...' : 'Seleccioná una materia'}</option>
                        {disponibles.map((m) => (
                            <option key={m.materiaId} value={m.materiaId}>
                                {m.nombre} ({m.codigo})
                            </option>
                        ))}
                    </Select>
                    <div className="grid grid-cols-3 gap-3">
                        <Input label="Año" type="number" min={1} value={anio} onChange={(e) => setAnio(Number(e.target.value))} />
                        <Input label="Cuatrimestre" type="number" min={1} value={cuatrimestre} onChange={(e) => setCuatrimestre(Number(e.target.value))} />
                        <Input label="Orden" type="number" min={1} value={orden} onChange={(e) => setOrden(Number(e.target.value))} />
                    </div>
                    {agregarMutation.isError && (
                        <Alert variant="error">No se pudo agregar la materia. Podría estar ya en el plan.</Alert>
                    )}
                    <Button
                        onClick={() => agregarMutation.mutate({ materiaId, anio, cuatrimestre, orden })}
                        loading={agregarMutation.isPending}
                        disabled={materiaId === 0}
                        className="w-full"
                    >
                        Agregar al plan
                    </Button>
                </div>
            </Card>

            <Modal
                isOpen={!!quitarConfirm}
                onClose={() => { setQuitarConfirm(null); quitarMutation.reset(); }}
                title="Quitar materia del plan"
                size="md"
            >
                {quitarConfirm && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-300">
                            Estás por quitar <strong className="text-white">{quitarConfirm.codigo} - {quitarConfirm.nombre}</strong> del plan de estudios.
                        </p>
                        <div className="bg-neon-red/10 border border-neon-red/30 rounded-lg p-3">
                            <p className="text-sm text-neon-red font-medium">Esta acción es irreversible</p>
                            <ul className="mt-2 text-sm text-slate-300 list-disc list-inside space-y-1">
                                <li>Se eliminará permanentemente el progreso académico de todos los usuarios en esta materia para esta carrera</li>
                                <li>Se eliminarán todas las planificaciones que la incluyan (bloques horarios)</li>
                                <li>Se eliminarán las correlativas asociadas a esta materia en esta carrera</li>
                                <li>Para volver a incluirla, deberás agregarla nuevamente desde cero</li>
                            </ul>
                        </div>
                        {quitarMutation.isError && (
                            <Alert variant="error">Error al quitar la materia del plan</Alert>
                        )}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={() => { setQuitarConfirm(null); quitarMutation.reset(); }}>Cancelar</Button>
                            <Button
                                variant="danger"
                                onClick={() => quitarMutation.mutate(quitarConfirm.carreraMateriaId)}
                                loading={quitarMutation.isPending}
                            >
                                Quitar del plan
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}