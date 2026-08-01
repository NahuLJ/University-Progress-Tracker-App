import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { carrerasService } from '../services/carreras.service';
import { useAdminCarreras } from '../hooks/useAdminCarreras';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { QueryError } from '../components/common/QueryError';
import { CarreraEditTabs } from '../components/admin/CarreraEditTabs';
import { PlanEstudiosEditor } from '../components/admin/PlanEstudiosEditor';
import { CorrelativasEditor } from '../components/admin/CorrelativasEditor';

const carreraSchema = z.object({
    nombre: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
    descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
    duracionAnios: z.coerce.number().min(1, 'Mínimo 1 año').max(10, 'Máximo 10 años'),
});

type CarreraForm = z.input<typeof carreraSchema>;

export function CarreraEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const carreraId = Number(id);
    const [tab, setTab] = useState<'datos' | 'plan' | 'correlativas'>('datos');

    const { data: carrera, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['carrera', carreraId],
        queryFn: () => carrerasService.obtenerCarrera(carreraId),
        enabled: !!carreraId,
    });

    const { actualizarCarrera } = useAdminCarreras();

    const form = useForm<CarreraForm>({
        resolver: zodResolver(carreraSchema),
    });

    useEffect(() => {
        if (carrera) {
            form.reset({
                nombre: carrera.nombre,
                descripcion: carrera.descripcion ?? '',
                duracionAnios: carrera.duracionAnios,
            });
        }
    }, [carrera, form]);

    const onSubmit = (data: CarreraForm) => {
        actualizarCarrera.mutate(
            { id: carreraId, data: { nombre: data.nombre, descripcion: data.descripcion || undefined, duracionAnios: Number(data.duracionAnios) } },
            { onSuccess: () => navigate('/admin') },
        );
    };

    if (isLoading) return <LoadingSpinner />;
    if (isError) return <QueryError error={error} onRetry={() => refetch()} />;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/admin')} className="text-slate-400 hover:text-white transition-colors">
                    <Icon name="arrowLeft" className="w-5 h-5" />
                </button>
                <div>
                    <p className="text-sm text-slate-400">Admin &gt; Carreras &gt; {carrera?.nombre} &gt; Editar</p>
                    <h1 className="text-2xl font-bold text-white">Editar carrera</h1>
                </div>
            </div>

            <CarreraEditTabs active={tab} onChange={setTab} />

            {tab === 'datos' && (
                <Card className="p-6 max-w-xl mx-auto">
                    <h2 className="text-xl font-bold text-white mb-1 border-l-4 border-neon-cyan pl-3">Datos generales</h2>
                    <p className="text-sm text-slate-400 mb-4 pl-3">Información de la carrera</p>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Nombre"
                            placeholder="Ej. Ingeniería en Informática"
                            error={form.formState.errors.nombre?.message}
                            {...form.register('nombre')}
                        />
                        <Input
                            label="Descripción (opcional, máx. 500 caracteres)"
                            placeholder="Breve descripción de la carrera"
                            error={form.formState.errors.descripcion?.message}
                            textarea
                            maxLength={500}
                            {...form.register('descripcion')}
                        />
                        <Input
                            label="Duración (años)"
                            type="number"
                            step="0.1"
                            min={1}
                            max={10}
                            error={form.formState.errors.duracionAnios?.message}
                            {...form.register('duracionAnios')}
                        />
                        <div className="flex justify-end pt-2">
                            <Button type="submit" loading={actualizarCarrera.isPending}>
                                Guardar cambios
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {tab === 'plan' && (
                <Card>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-white mb-1 border-l-4 border-neon-cyan pl-3">Plan de estudios</h2>
                        <p className="text-sm text-slate-400 mb-4 pl-3">Materias y orden de cursado</p>
                    </div>
                    <div className="px-6 pb-6">
                        <PlanEstudiosEditor carreraId={carreraId} />
                    </div>
                </Card>
            )}

            {tab === 'correlativas' && (
                <Card>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-white mb-1 border-l-4 border-neon-cyan pl-3">Correlativas</h2>
                        <p className="text-sm text-slate-400 mb-4 pl-3">Requisitos y dependencias entre materias</p>
                    </div>
                    <div className="px-6 pb-6">
                        <CorrelativasEditor carreraId={carreraId} />
                    </div>
                </Card>
            )}
        </div>
    );
}