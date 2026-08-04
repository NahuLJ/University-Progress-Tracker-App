import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

const periodoSchema = z.object({
    anio: z.number().min(2020).max(2030),
    instancia: z.enum(['Verano', '1er Cuatrimestre', '2do Cuatrimestre']),
    nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
});

type PeriodoFormData = z.infer<typeof periodoSchema>;

interface EditarPeriodoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: PeriodoFormData) => void;
    initialData: {
        anio: number;
        instancia: 'Verano' | '1er Cuatrimestre' | '2do Cuatrimestre';
        nombre: string;
    } | null;
    readonlyAnioInstancia?: boolean;
}

export function EditarPeriodoModal({ isOpen, onClose, onSuccess, initialData, readonlyAnioInstancia = false }: EditarPeriodoModalProps) {
    const form = useForm<PeriodoFormData>({
        resolver: zodResolver(periodoSchema),
        defaultValues: initialData ?? {
            anio: new Date().getFullYear(),
            instancia: '1er Cuatrimestre',
            nombre: '',
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset(initialData);
        }
    }, [initialData, form]);

    const instanciaValue = form.watch('instancia');

    const onSubmit = (data: PeriodoFormData) => {
        onSuccess(data);
        onClose();
        form.reset();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar planificación" size="md">
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
                <Input
                    label="Año"
                    type="number"
                    min={2020}
                    max={2030}
                    error={form.formState.errors.anio?.message}
                    disabled={readonlyAnioInstancia}
                    {...form.register('anio', { valueAsNumber: true })}
                />

                <Select
                    label="Instancia"
                    error={form.formState.errors.instancia?.message}
                    disabled={readonlyAnioInstancia}
                    value={instanciaValue}
                    onChange={(e) => form.setValue('instancia', e.target.value as typeof instanciaValue)}
                >
                    <option value="Verano">Verano</option>
                    <option value="1er Cuatrimestre">1er Cuatrimestre</option>
                    <option value="2do Cuatrimestre">2do Cuatrimestre</option>
                </Select>

                <Input
                    label="Nombre"
                    placeholder="Ej: Variante A, Intensiva, etc."
                    error={form.formState.errors.nombre?.message}
                    {...form.register('nombre')}
                />

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="warning">Guardar cambios</Button>
                </div>
            </form>
        </Modal>
    );
}