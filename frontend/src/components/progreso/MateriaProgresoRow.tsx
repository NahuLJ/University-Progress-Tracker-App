import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { StatusDot } from '../ui/StatusBadge';
import { CompletarMateriaModal } from './CompletarMateriaModal';

// Schema de validación para progreso académico
const progresoSchema = z.object({
    estado: z.enum(['Pendiente', 'En Proceso', 'Completada']),
    nota: z.number().min(4).max(10).optional(),
    tipoAprobacion: z.enum(['Final', 'Promocion']).optional(),
}).refine(
    (data) => data.estado !== 'Completada' || (data.nota !== undefined && data.tipoAprobacion !== undefined),
    { message: 'Nota y tipo de aprobación son obligatorios al completar la materia' }
);

type ProgresoFormData = z.infer<typeof progresoSchema>;

interface MateriaProgresoRowProps {
    materia: any;
    progreso: any;
    onSave: (id: number, data: ProgresoFormData) => void;
    isSaving: boolean;
}

export function MateriaProgresoRow({ materia, progreso, onSave, isSaving }: MateriaProgresoRowProps) {
    const [editando, setEditando] = useState(false);
    const [mostrarModal, setMostrarModal] = useState(false);
    const estadoAnterior = useRef(progreso.estado.nombre);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProgresoFormData>({
        resolver: zodResolver(progresoSchema),
        defaultValues: {
            estado: progreso.estado.nombre,
            nota: progreso.nota ?? undefined,
            tipoAprobacion: progreso.tipoAprobacion ?? undefined,
        },
    });

    const estadoSeleccionado = watch('estado');
    const notaActual = watch('nota');
    const tipoActual = watch('tipoAprobacion');

    const handleEstadoChange = (nuevoEstado: string) => {
        setEditando(true);
        if (nuevoEstado === 'Completada' && (notaActual === undefined || tipoActual === undefined)) {
            setMostrarModal(true);
        }
    };

    const handleConfirmarCompletar = (nota: number, tipoAprobacion: string) => {
        const data: ProgresoFormData = {
            estado: 'Completada',
            nota,
            tipoAprobacion: tipoAprobacion as 'Final' | 'Promocion',
        };
        setValue('nota', nota);
        setValue('tipoAprobacion', tipoAprobacion as 'Final' | 'Promocion');
        onSave(progreso.progresoId, data);
        estadoAnterior.current = 'Completada';
        setEditando(false);
    };

    const handleCancelarModal = () => {
        setMostrarModal(false);
        if (notaActual === undefined || tipoActual === undefined) {
            setValue('estado', estadoAnterior.current);
            setEditando(false);
        }
    };

    const onSubmit = (data: ProgresoFormData) => {
        onSave(progreso.progresoId, data);
        estadoAnterior.current = data.estado;
        setEditando(false);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-12 gap-2 items-center p-3 hover:bg-base-700/50">
            <span className="col-span-3 font-medium text-slate-100">{materia.nombre}</span>
            <span className="col-span-2 text-slate-400">{materia.codigo}</span>
            <span className="col-span-1 text-center text-slate-300">{materia.creditos}</span>

            <div className="col-span-2 flex items-center gap-2">
                    <StatusDot estado={estadoSeleccionado} className="flex-shrink-0" />
                    <select
                        {...register('estado', {
                            onChange: (e) => handleEstadoChange(e.target.value),
                        })}
                        className={
                        `w-full border bg-base-800 rounded p-1 text-sm text-slate-100 ${estadoSeleccionado === 'Completada' ? 'border-neon-green' :
                            estadoSeleccionado === 'En Proceso' ? 'border-neon-yellow' : 'border-base-500'
                        }`}
                    >
                        <option value="Pendiente">● Pendiente</option>
                        <option value="En Proceso">● En Proceso</option>
                        <option value="Completada">● Completada</option>
                    </select>
                {errors.estado && <p className="text-sm text-neon-red">{errors.estado.message}</p>}
            </div>

            {estadoSeleccionado === 'Completada' && (
                <>
                    <div className="col-span-1">
                        <input type="number" {...register('nota', { valueAsNumber: true })}
                            placeholder="4-10" min={4} max={10}
                            className="w-full border bg-base-800 rounded p-1 text-sm text-slate-100 text-center" />
                        {errors.nota && <p className="text-sm text-neon-red">{errors.nota.message}</p>}
                    </div>
                    <div className="col-span-2">
                        <select {...register('tipoAprobacion')} className="w-full border bg-base-800 rounded p-1 text-sm text-slate-100">
                            <option value="">Tipo</option>
                            <option value="Final">Final</option>
                            <option value="Promocion">Promoción</option>
                        </select>
                        {errors.tipoAprobacion && <p className="text-sm text-neon-red">{errors.tipoAprobacion.message}</p>}
                    </div>
                </>
            )}

            {!estadoSeleccionado.startsWith('Completada') && (
                <div className="col-span-3" />
            )}

            <div className="col-span-1">
                {editando && (
                    <Button type="submit" size="sm" loading={isSaving}>Guardar</Button>
                )}
            </div>

            <CompletarMateriaModal
                isOpen={mostrarModal}
                onClose={handleCancelarModal}
                materiaNombre={materia.nombre}
                onConfirm={handleConfirmarCompletar}
            />
        </form>
    );
}