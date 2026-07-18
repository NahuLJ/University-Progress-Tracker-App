import React, { useMemo } from 'react';
import { usePlanificacionStore } from '../../store/planificacion.store';
import { BloqueHorarioCelda } from './BloqueHorarioCelda';
import { MateriaDisponibleList } from './MateriaDisponibleList';

const DIAS = [
    { id: 'Lunes', corto: 'Lun' },
    { id: 'Martes', corto: 'Mar' },
    { id: 'Miércoles', corto: 'Mié' },
    { id: 'Jueves', corto: 'Jue' },
    { id: 'Viernes', corto: 'Vie' },
    { id: 'Sábado', corto: 'Sáb' },
];

const BLOQUES = [
    { id: 1, label: '08-10' },
    { id: 2, label: '10-12' },
    { id: 3, label: '12-14' },
    { id: 4, label: '14-16' },
    { id: 5, label: '16-18' },
    { id: 6, label: '18-20' },
    { id: 7, label: '20-22' },
];

export function CalendarioSemanal() {
    const celdas = usePlanificacionStore((s) => s.celdas);
    const materiasDisponibles = usePlanificacionStore((s) => s.materiasDisponibles);
    const asignarMateria = usePlanificacionStore((s) => s.asignarMateria);

    const materiasEnCalendario = useMemo(() => {
        const items: any[] = [];
        Object.entries(celdas).forEach(([key, materias]) => {
            const [bloqueId, dia] = key.split('-');
            materias.forEach((materia) => {
                items.push({ materiaId: materia.materiaId, bloqueId: parseInt(bloqueId), dia, materia });
            });
        });
        return items;
    }, [celdas]);

    const materiasDisponiblesFiltradas = useMemo(() => {
        return materiasDisponibles.filter(
            (m) => !materiasEnCalendario.some((cm) => cm.materiaId === m.materiaId)
        );
    }, [materiasDisponibles, materiasEnCalendario]);

    const handleDrop = (bloqueId: number, dia: string, materiaId: number) => {
        asignarMateria(bloqueId, dia, materiaId);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-[auto_repeat(6,1fr)] gap-1">
                <div className="font-semibold p-2 text-sm bg-base-700/60 text-slate-200">Horario</div>
                {DIAS.map((dia) => (
                    <div key={dia.id} className="font-semibold p-2 text-sm text-center bg-base-700/60 text-slate-200">
                        {dia.corto}
                    </div>
                ))}

                {BLOQUES.map((bloque) => (
                    <React.Fragment key={bloque.id}>
                        <div className="p-2 text-sm text-slate-400 font-medium">
                            {bloque.label}
                        </div>
                        {DIAS.map((dia) => (
                            <BloqueHorarioCelda
                                key={`${dia.id}-${bloque.id}`}
                                bloqueId={bloque.id}
                                dia={dia.id}
                                onDrop={handleDrop}
                            />
                        ))}
                    </React.Fragment>
                ))}
            </div>

            <MateriaDisponibleList materias={materiasDisponiblesFiltradas} />
        </div>
    );
}