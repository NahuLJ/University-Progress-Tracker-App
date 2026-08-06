import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import type { UseMutationResult } from '@tanstack/react-query';
import type { ActividadCredito, CategoriaCredito } from '../../types/creditos.types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    modo: 'crear' | 'editar';
    elemento?: ActividadCredito;
    categoriasActivas: CategoriaCredito[];
    crearActividad: UseMutationResult<
        ActividadCredito,
        unknown,
        { nombre: string; descripcion?: string; categoriaCreditoId: number; creditos: number }
    >;
    actualizarActividad: UseMutationResult<
        ActividadCredito,
        unknown,
        {
            actividadCreditoId: number;
            data: { nombre?: string; descripcion?: string; creditos?: number };
        }
    >;
}

export function CreditoActividadModal({
    isOpen,
    onClose,
    modo,
    elemento,
    categoriasActivas,
    crearActividad,
    actualizarActividad,
}: Props) {
    const [nombre, setNombre] = useState(elemento?.nombre ?? '');
    const [descripcion, setDescripcion] = useState(elemento?.descripcion ?? '');
    const [creditos, setCreditos] = useState(String(elemento?.creditos ?? '1'));
    const [categoriaId, setCategoriaId] = useState(0);

    const esCrear = modo === 'crear';
    const mutation = esCrear ? crearActividad : actualizarActividad;
    const creditosValidos = Number.isInteger(Number(creditos)) && Number(creditos) > 0;

    const handleSubmit = () => {
        if (!nombre.trim() || !creditosValidos) return;
        if (esCrear) {
            if (!categoriaId) return;
            crearActividad.mutate(
                {
                    nombre: nombre.trim(),
                    descripcion: descripcion || undefined,
                    categoriaCreditoId: categoriaId,
                    creditos: Number(creditos),
                },
                { onSuccess: onClose },
            );
        } else if (elemento) {
            actualizarActividad.mutate(
                {
                    actividadCreditoId: elemento.actividadCreditoId,
                    data: {
                        nombre: nombre.trim(),
                        descripcion: descripcion || undefined,
                        creditos: Number(creditos),
                    },
                },
                { onSuccess: onClose },
            );
        }
    };

    const selectCategoria = esCrear ? (
        <Select label="Categoría" value={categoriaId} onChange={(e) => setCategoriaId(Number(e.target.value))}>
            <option value={0}>Seleccioná una categoría</option>
            {categoriasActivas.map((c) => (
                <option key={c.categoriaCreditoId} value={c.categoriaCreditoId}>
                    {c.nombre}
                </option>
            ))}
        </Select>
    ) : (
        <Select label="Categoría" value={elemento?.categoriaCreditoId ?? 0} disabled>
            <option value={elemento?.categoriaCreditoId ?? 0}>{elemento?.categoriaNombre}</option>
        </Select>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={esCrear ? 'Nueva actividad' : 'Editar actividad'}
            size="md"
        >
            <div className="space-y-4">
                {selectCategoria}

                <Input
                    label="Nombre"
                    placeholder="Ej. Taller de liderazgo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    maxLength={200}
                />
                <Input
                    label="Descripción (opcional, máx. 1000 caracteres)"
                    textarea
                    maxLength={1000}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                />
                <div className="max-w-xs">
                    <Input
                        label="Créditos que aporta"
                        type="number"
                        min={1}
                        value={creditos}
                        onChange={(e) => setCreditos(e.target.value)}
                    />
                </div>

                {mutation.isError && (
                    <Alert variant="error">
                        No se pudo guardar la actividad. El nombre podría estar duplicado en la categoría.
                    </Alert>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        loading={mutation.isPending}
                        disabled={!nombre.trim() || !creditosValidos || (esCrear && !categoriaId)}
                    >
                        {esCrear ? 'Crear actividad' : 'Guardar cambios'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
