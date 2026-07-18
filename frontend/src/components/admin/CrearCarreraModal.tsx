import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { useAdminCarreras } from '../../hooks/useAdminCarreras';

const carreraSchema = z.object({
    nombre: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
    descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
    duracionAnios: z.coerce.number().min(1, 'Mínimo 1 año').max(10, 'Máximo 10 años'),
});

type CarreraFormInput = z.input<typeof carreraSchema>;

interface CrearCarreraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CrearCarreraModal({ isOpen, onClose, onSuccess }: CrearCarreraModalProps) {
    const form = useForm<CarreraFormInput>({
        resolver: zodResolver(carreraSchema),
        defaultValues: { nombre: '', descripcion: '', duracionAnios: 1 },
    });

    const { crearCarrera } = useAdminCarreras();

    const onSubmit = (data: CarreraFormInput) => {
        crearCarrera.mutate(
            {
                nombre: data.nombre,
                descripcion: data.descripcion || undefined,
                duracionAnios: Number(data.duracionAnios),
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
        <Modal isOpen={isOpen} onClose={onClose} title="Nueva carrera" size="md">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Nombre"
                    placeholder="Ej. Ingeniería en Informática"
                    error={form.formState.errors.nombre?.message}
                    {...form.register('nombre')}
                />
                <Input
                    label="Descripción (opcional)"
                    placeholder="Breve descripción de la carrera"
                    error={form.formState.errors.descripcion?.message}
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

                {crearCarrera.isError && (
                    <Alert variant="error">
                        No se pudo crear la carrera. Verificá los datos e intentá nuevamente.
                    </Alert>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={crearCarrera.isPending}>
                        Crear carrera
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
