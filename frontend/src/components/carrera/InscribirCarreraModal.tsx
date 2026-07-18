import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { carrerasService } from '../../services/carreras.service';
import { useInscribirCarrera } from '../../hooks/useCarreras';

const inscribirSchema = z.object({
    carreraId: z.number().min(1, 'Seleccioná una carrera'),
    fechaInicio: z.string().min(1, 'La fecha es obligatoria'),
});

type InscribirFormData = z.infer<typeof inscribirSchema>;

interface InscribirCarreraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function InscribirCarreraModal({ isOpen, onClose, onSuccess }: InscribirCarreraModalProps) {
    const form = useForm<InscribirFormData>({
        resolver: zodResolver(inscribirSchema),
        defaultValues: {
            carreraId: 0,
            fechaInicio: new Date().toISOString().split('T')[0],
        },
    });

    const inscribirCarrera = useInscribirCarrera();

    const { data: carrerasDisponibles, isLoading } = useQuery({
        queryKey: ['carreras', 'disponibles'],
        queryFn: () => carrerasService.obtenerCarrerasDisponibles(),
        enabled: isOpen,
    });

    const onSubmit = (data: InscribirFormData) => {
        inscribirCarrera.mutate(data, {
            onSuccess: () => {
                if (onSuccess) onSuccess();
                onClose();
                form.reset();
            },
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Inscribirse a una carrera" size="md">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Select
                    label="Carrera"
                    placeholder="Seleccioná una carrera"
                    error={form.formState.errors.carreraId?.message}
                    disabled={isLoading}
                    {...form.register('carreraId', { valueAsNumber: true })}
                >
                    <option value="0">
                        {isLoading ? 'Cargando carreras...' : 'Seleccioná una carrera'}
                    </option>
                    {carrerasDisponibles
                        ?.filter((c) => !c.inscripto)
                        .map((c) => (
                            <option key={c.carreraId} value={c.carreraId}>{c.nombre}</option>
                        ))}
                </Select>

                <Input
                    label="Fecha de inicio"
                    type="date"
                    error={form.formState.errors.fechaInicio?.message}
                    {...form.register('fechaInicio')}
                />

                {inscribirCarrera.isError && (
                    <p className="text-sm text-red-600">
                        No se pudo completar la inscripción. Intentá nuevamente.
                    </p>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={inscribirCarrera.isPending}>
                        Confirmar inscripción
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
