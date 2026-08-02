import { useMemo } from 'react';
import { Card } from '../ui/Card';
import { usePlanificacionStore } from '../../store/planificacion.store';
import { horasAsignadas, HORAS_POR_BLOQUE } from '../../types/planificacion.types';
import type { MateriaEnCelda } from '../../types/planificacion.types';

interface MateriaDisponibleListProps {
    materias: MateriaEnCelda[];
}

export function MateriaDisponibleList({ materias }: MateriaDisponibleListProps) {
    const celdas = usePlanificacionStore((s) => s.celdas);
    const ordenadas = useMemo(
        () => [...materias].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
        [materias],
    );

    if (ordenadas.length === 0) {
        return (
            <Card className="h-full">
                <h3 className="text-sm font-semibold mb-3">Materias disponibles</h3>
                <p className="text-text-muted text-sm">No hay materias pendientes para planificar</p>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <h3 className="text-sm font-semibold mb-3">Materias disponibles</h3>
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {ordenadas.map((materia) => {
                    const yaAsignadas = horasAsignadas(materia.materiaId, celdas);
                    const restan = materia.cargaHoraria - yaAsignadas;
                    const bloquesRestantes = Math.ceil(restan / HORAS_POR_BLOQUE);
                    return (
                        <div
                            key={materia.materiaId}
                            className="p-3 border border-hairline rounded-md cursor-grab active:cursor-grabbing hover:bg-bg-surface-secondary transition-colors"
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', materia.materiaId.toString());
                                e.dataTransfer.effectAllowed = 'move';
                                usePlanificacionStore.getState().setDraggedMateriaId(materia.materiaId);
                            }}
                            onDragEnd={() => {
                                usePlanificacionStore.getState().setDraggedMateriaId(null);
                                usePlanificacionStore.getState().setDraggedFromKey(null);
                            }}
                        >
                            <div className="font-medium text-sm text-text-default">{materia.nombre}</div>
                            <div className="text-xs text-text-muted">
                                {materia.codigo} &bull; {materia.creditos} créditos &bull; {materia.cargaHoraria}h/sem
                                {yaAsignadas > 0 && (
                                    <span className="text-status-warning"> &bull; {yaAsignadas}h asignadas, restan {restan}h ({bloquesRestantes} bloques)</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
