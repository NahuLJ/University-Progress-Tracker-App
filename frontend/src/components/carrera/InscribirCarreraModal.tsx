import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useInscribirCarrera } from '../../hooks/useCarreras';

const inscribirSchema = z.object({
    fechaInicio: z.string().min(1, 'La fecha es obligatoria'),
});

type InscribirFormData = z.infer<typeof inscribirSchema>;

interface InscribirCarreraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    carreraId: number;
    carreraNombre: string;
}

export function InscribirCarreraModal({ isOpen, onClose, onSuccess, carreraId, carreraNombre }: InscribirCarreraModalProps) {
    const form = useForm<InscribirFormData>({
        resolver: zodResolver(inscribirSchema),
        defaultValues: {
            fechaInicio: new Date().toISOString().split('T')[0],
        },
    });

    const inscribirCarrera = useInscribirCarrera();

    const onSubmit = (data: InscribirFormData) => {
        inscribirCarrera.mutate({ carreraId, ...data }, {
            onSuccess: () => {
                if (onSuccess) onSuccess();
                onClose();
                form.reset();
            },
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Inscribirse a ${carreraNombre}`} size="md">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="p-3 bg-base-800/50 rounded-lg border border-base-600">
                    <p className="text-sm font-medium text-slate-300 mb-1">Carrera</p>
                    <p className="text-white">{carreraNombre}</p>
                </div>

                <Input
                    label="Fecha de inicio"
                    type="date"
                    error={form.formState.errors.fechaInicio?.message}
                    {...form.register('fechaInicio')}
                />

                {inscribirCarrera.isError && (
                    <p className="text-sm text-neon-red">
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