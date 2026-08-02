import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

const ORDEN_INSTANCIA: Record<string, number> = {
    Verano: 0,
    '1er Cuatrimestre': 1,
    '2do Cuatrimestre': 2,
};

const INSTANCIAS = ['Verano', '1er Cuatrimestre', '2do Cuatrimestre'] as const;

const nuevoPeriodoSchema = z.object({
    anio: z.number().min(2020).max(2030),
    instancia: z.enum(INSTANCIAS),
    nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
});

type NuevoPeriodoFormData = z.infer<typeof nuevoPeriodoSchema>;

interface NuevoPeriodoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: NuevoPeriodoFormData & { trayectoriaId?: number; planificacionOrigenId?: number }) => void;
    trayectoriaId?: number;
    planificacionOrigenId?: number;
    origenAnio?: number;
    origenInstancia?: 'Verano' | '1er Cuatrimestre' | '2do Cuatrimestre';
}

export function NuevoPeriodoModal({ isOpen, onClose, onSuccess, trayectoriaId, planificacionOrigenId, origenAnio, origenInstancia }: NuevoPeriodoModalProps) {
    const form = useForm<NuevoPeriodoFormData>({
        resolver: zodResolver(nuevoPeriodoSchema),
        defaultValues: {
            anio: new Date().getFullYear(),
            instancia: '1er Cuatrimestre',
            nombre: '',
        },
    });

    useEffect(() => {
        if (!isOpen) return;
        const anio = planificacionOrigenId && origenAnio !== undefined
            ? origenInstancia === '2do Cuatrimestre' ? origenAnio + 1 : origenAnio
            : new Date().getFullYear();

        const instancia = (() => {
            if (origenAnio === undefined || origenInstancia === undefined) return '1er Cuatrimestre';
            if (anio > origenAnio) return 'Verano';
            const ordenOrigen = ORDEN_INSTANCIA[origenInstancia];
            const disponibles = INSTANCIAS.filter((i) => ORDEN_INSTANCIA[i] > ordenOrigen);
            return disponibles[0] ?? '1er Cuatrimestre';
        })();

        form.reset({ anio, instancia, nombre: '' });
    }, [isOpen, planificacionOrigenId, origenAnio, origenInstancia, form]);

    const anioSeleccionado = form.watch('anio');
    const instanciaValue = form.watch('instancia');

    const instanciasDisponibles = useMemo(() => {
        if (origenAnio === undefined || origenInstancia === undefined) {
            return [...INSTANCIAS];
        }
        if (anioSeleccionado > origenAnio) {
            return [...INSTANCIAS];
        }
        if (anioSeleccionado === origenAnio) {
            const ordenOrigen = ORDEN_INSTANCIA[origenInstancia];
            return INSTANCIAS.filter((i) => ORDEN_INSTANCIA[i] > ordenOrigen);
        }
        return [];
    }, [origenAnio, origenInstancia, anioSeleccionado]);

    useEffect(() => {
        const current = form.getValues('instancia');
        if (instanciasDisponibles.length > 0 && !instanciasDisponibles.includes(current)) {
            form.setValue('instancia', instanciasDisponibles[0]);
        }
    }, [instanciasDisponibles, form]);

    const onSubmit = (data: NuevoPeriodoFormData) => {
        onSuccess({ ...data, trayectoriaId, planificacionOrigenId });
        onClose();
        form.reset();
    };

    const isSucesiva = trayectoriaId !== undefined;
    const noInstancias = isSucesiva && origenAnio !== undefined && instanciasDisponibles.length === 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isSucesiva ? 'Nueva planificación sucesiva' : 'Nueva planificación'} size="md">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {isSucesiva && (
                    <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-md p-3 text-sm text-accent-primary">
                        {planificacionOrigenId
                            ? 'Esta planificación continuará la seleccionada en la trayectoria.'
                            : 'Esta planificación se creará dentro de la trayectoria actual.'}
                    </div>
                )}

                <Input
                    label="Año"
                    type="number"
                    min={origenAnio ?? 2020}
                    max={2030}
                    error={form.formState.errors.anio?.message}
                    {...form.register('anio', { valueAsNumber: true })}
                />

                <Select
                    label="Instancia"
                    error={form.formState.errors.instancia?.message}
                    value={instanciaValue}
                    onChange={(e) => form.setValue('instancia', e.target.value as typeof instanciaValue)}
                >
                    {instanciasDisponibles.map((i) => (
                        <option key={i} value={i}>{i}</option>
                    ))}
                </Select>

                {noInstancias && (
                    <p className="text-sm text-status-warning">
                        No hay cuatrimestres disponibles para {anioSeleccionado}. Seleccioná un año posterior.
                    </p>
                )}

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
                    <Button type="submit" variant="success" disabled={noInstancias}>
                        {isSucesiva ? 'Crear planificación sucesiva' : 'Crear planificación'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
