import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

const nuevoPeriodoSchema = z.object({
    anio: z.number().min(2020).max(2030),
    instancia: z.enum(['Verano', '1er Cuatrimestre', '2do Cuatrimestre']),
    nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
});

type NuevoPeriodoFormData = z.infer<typeof nuevoPeriodoSchema>;

interface NuevoPeriodoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: NuevoPeriodoFormData & { trayectoriaId?: number; planificacionOrigenId?: number }) => void;
    trayectoriaId?: number;
    planificacionOrigenId?: number;
}

export function NuevoPeriodoModal({ isOpen, onClose, onSuccess, trayectoriaId, planificacionOrigenId }: NuevoPeriodoModalProps) {
    const form = useForm<NuevoPeriodoFormData>({
        resolver: zodResolver(nuevoPeriodoSchema),
        defaultValues: {
            anio: new Date().getFullYear(),
            instancia: '1er Cuatrimestre',
            nombre: '',
        },
    });

    const onSubmit = (data: NuevoPeriodoFormData) => {
        onSuccess({ ...data, trayectoriaId, planificacionOrigenId });
        onClose();
        form.reset();
    };

    const isSucesiva = trayectoriaId !== undefined;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isSucesiva ? 'Nueva planificación sucesiva' : 'Nueva planificación'} size="md">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {isSucesiva && (
                    <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-3 text-sm text-neon-cyan">
                        {planificacionOrigenId
                            ? 'Esta planificación continuará la seleccionada en la trayectoria.'
                            : 'Esta planificación se creará dentro de la trayectoria actual.'}
                    </div>
                )}

                <Input
                    label="Año"
                    type="number"
                    min={2020}
                    max={2030}
                    error={form.formState.errors.anio?.message}
                    {...form.register('anio', { valueAsNumber: true })}
                />

                <Select
                    label="Instancia"
                    error={form.formState.errors.instancia?.message}
                    {...form.register('instancia')}
                >
                    <option value="Verano">Verano</option>
                    <option value="1er Cuatrimestre">1er Cuatrimestre</option>
                    <option value="2do Cuatrimestre">2do Cuatrimestre</option>
                </Select>

                <Input
                    label="Nombre"
                    placeholder={isSucesiva ? 'Ej: RPA, IA, Mixta...' : 'Ej: Variante A, Intensiva, etc.'}
                    error={form.formState.errors.nombre?.message}
                    {...form.register('nombre')}
                />

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="success">
                        {isSucesiva ? 'Crear planificación sucesiva' : 'Crear planificación'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
