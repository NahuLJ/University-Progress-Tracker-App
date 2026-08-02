import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { materiasAdminService } from '../services/carreras.service';
import { useAdminMaterias } from '../hooks/useAdminMaterias';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { QueryError } from '../components/common/QueryError';

const materiaSchema = z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio').max(200, 'Máximo 200 caracteres'),
    codigo: z.string().min(1, 'El código es obligatorio').max(20, 'Máximo 20 caracteres'),
    descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
    cargaHoraria: z.coerce.number().int('Debe ser entero').min(1, 'Mínimo 1 hora'),
    creditos: z.coerce.number().int('Debe ser entero').min(1, 'Mínimo 1 crédito'),
});

type MateriaForm = z.input<typeof materiaSchema>;

export function MateriaEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const materiaId = Number(id);

    const { data: materia, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['materia', materiaId],
        queryFn: () => materiasAdminService.obtenerMateria(materiaId),
        enabled: !!materiaId,
    });

    const { actualizarMateria } = useAdminMaterias();

    const form = useForm<MateriaForm>({
        resolver: zodResolver(materiaSchema),
    });

    useEffect(() => {
        if (materia) {
            form.reset({
                nombre: materia.nombre,
                codigo: materia.codigo,
                descripcion: materia.descripcion ?? '',
                cargaHoraria: materia.cargaHoraria,
                creditos: materia.creditos,
            });
        }
    }, [materia, form]);

    const onSubmit = (data: MateriaForm) => {
        actualizarMateria.mutate(
            {
                id: materiaId,
                data: {
                    nombre: data.nombre,
                    codigo: data.codigo,
                    descripcion: data.descripcion || undefined,
                    cargaHoraria: Number(data.cargaHoraria),
                    creditos: Number(data.creditos),
                },
            },
            { onSuccess: () => navigate(`/admin/materias/${materiaId}`) },
        );
    };

    if (isLoading) return <LoadingSpinner />;
    if (isError) return <QueryError error={error} onRetry={() => refetch()} />;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(`/admin/materias/${materiaId}`)} className="text-text-muted hover:text-text-default transition-colors">
                    <Icon name="arrowLeft" className="w-5 h-5" />
                </button>
                <div>
                    <p className="text-sm text-text-muted">Admin &gt; Materias &gt; {materia?.nombre} &gt; Editar</p>
                    <h1 className="text-2xl font-bold text-text-default">Editar materia</h1>
                </div>
            </div>

            <Card className="p-6 max-w-xl mx-auto">
                    <h2 className="text-sm font-semibold text-text-default mb-1 border-l-2 border-accent-primary pl-3">Datos generales</h2>
                    <p className="text-sm text-text-muted mb-4 pl-3">Información de la materia</p>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Nombre"
                        placeholder="Ej. Álgebra Lineal"
                        error={form.formState.errors.nombre?.message}
                        {...form.register('nombre')}
                    />
                    <Input
                        label="Código"
                        placeholder="Ej. MAT102"
                        error={form.formState.errors.codigo?.message}
                        {...form.register('codigo')}
                    />
                    <Input
                        label="Descripción (opcional, máx. 500 caracteres)"
                        placeholder="Breve descripción de la materia"
                        error={form.formState.errors.descripcion?.message}
                        textarea
                        maxLength={500}
                        {...form.register('descripcion')}
                    />
                    <Input
                        label="Carga horaria"
                        type="number"
                        min={1}
                        error={form.formState.errors.cargaHoraria?.message}
                        {...form.register('cargaHoraria')}
                    />
                    <Input
                        label="Créditos"
                        type="number"
                        min={1}
                        error={form.formState.errors.creditos?.message}
                        {...form.register('creditos')}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={() => navigate(`/admin/materias/${materiaId}`)}>Cancelar</Button>
                        <Button type="submit" loading={actualizarMateria.isPending}>Guardar cambios</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}