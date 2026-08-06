import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import type { UseMutationResult } from '@tanstack/react-query';
import type { CategoriaCredito } from '../../types/creditos.types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    modo: 'crear' | 'editar';
    elemento?: CategoriaCredito;
    crearCategoria: UseMutationResult<
        CategoriaCredito,
        unknown,
        { nombre: string; descripcion?: string }
    >;
    actualizarCategoria: UseMutationResult<
        CategoriaCredito,
        unknown,
        { categoriaCreditoId: number; data: { nombre?: string; descripcion?: string } }
    >;
}

export function CreditoCategoriaModal({
    isOpen,
    onClose,
    modo,
    elemento,
    crearCategoria,
    actualizarCategoria,
}: Props) {
    const [nombre, setNombre] = useState(elemento?.nombre ?? '');
    const [descripcion, setDescripcion] = useState(elemento?.descripcion ?? '');

    const esCrear = modo === 'crear';
    const mutation = esCrear ? crearCategoria : actualizarCategoria;

    const handleSubmit = () => {
        if (!nombre.trim()) return;
        const data = { nombre: nombre.trim(), descripcion: descripcion || undefined };
        if (esCrear) {
            crearCategoria.mutate(data, { onSuccess: onClose });
        } else if (elemento) {
            actualizarCategoria.mutate(
                { categoriaCreditoId: elemento.categoriaCreditoId, data },
                { onSuccess: onClose },
            );
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={esCrear ? 'Nueva categoría' : 'Editar categoría'}
            size="md"
        >
            <div className="space-y-4">
                <Input
                    label="Nombre"
                    placeholder="Ej. Seminarios"
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

                {mutation.isError && (
                    <Alert variant="error">
                        No se pudo guardar la categoría. El nombre podría estar duplicado.
                    </Alert>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} loading={mutation.isPending} disabled={!nombre.trim()}>
                        {esCrear ? 'Crear categoría' : 'Guardar cambios'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
