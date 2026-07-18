import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { useAdminMaterias } from '../../hooks/useAdminMaterias';

const materiaSchema = z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio').max(200, 'Máximo 200 caracteres'),
    codigo: z.string().min(1, 'El código es obligatorio').max(20, 'Máximo 20 caracteres'),
    descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
    cargaHoraria: z.coerce.number().int('Debe ser entero').min(1, 'Mínimo 1 hora'),
    creditos: z.coerce.number().int('Debe ser entero').min(1, 'Mínimo 1 crédito'),
});

type MateriaFormInput = z.input<typeof materiaSchema>;

interface CrearMateriaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CrearMateriaModal({ isOpen, onClose, onSuccess }: CrearMateriaModalProps) {
    const form = useForm<MateriaFormInput>({
        resolver: zodResolver(materiaSchema),
        defaultValues: { nombre: '', codigo: '', descripcion: '', cargaHoraria: 1, creditos: 1 },
    });

    const { crearMateria } = useAdminMaterias();

    const onSubmit = (data: MateriaFormInput) => {
        crearMateria.mutate(
            {
                nombre: data.nombre,
                codigo: data.codigo,
                descripcion: data.descripcion || undefined,
                cargaHoraria: Number(data.cargaHoraria),
                creditos: Number(data.creditos),
            },
            {
                onSuccess: () => {
                    form.reset();
                    if (onSuccess) onSuccess();
                    onClose();
                },
            },
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nueva materia" size="md">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Nombre"
                    placeholder="Ej. Análisis Matemático I"
                    error={form.formState.errors.nombre?.message}
                    {...form.register('nombre')}
                />
                <Input
                    label="Código"
                    placeholder="Ej. AMAT-101"
                    error={form.formState.errors.codigo?.message}
                    {...form.register('codigo')}
                />
                <Input
                    label="Descripción (opcional)"
                    placeholder="Breve descripción de la materia"
                    error={form.formState.errors.descripcion?.message}
                    {...form.register('descripcion')}
                />
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                {crearMateria.isError && (
                    <Alert variant="error">
                        No se pudo crear la materia. El código podría estar duplicado.
                    </Alert>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={crearMateria.isPending}>
                        Crear materia
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
