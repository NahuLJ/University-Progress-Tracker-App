import { useMemo } from 'react';
import { MateriaProgresoRow } from './MateriaProgresoRow';
import { Accordion } from '../ui/Accordion';

interface ProgresoTreeProps {
    progresos: any[];
    onSave: (id: number, data: any) => void;
    isSaving: boolean;
}

export function ProgresoTree({ progresos, onSave, isSaving }: ProgresoTreeProps) {
    const grouped = useMemo(() => {
        const map = new Map<number, Map<number, any[]>>();
        for (const p of progresos) {
            const anio = p.anio ?? 0;
            const cuatrimestre = p.cuatrimestre ?? 0;
            if (!map.has(anio)) map.set(anio, new Map());
            const cmap = map.get(anio)!;
            if (!cmap.has(cuatrimestre)) cmap.set(cuatrimestre, []);
            cmap.get(cuatrimestre)!.push(p);
        }
        const result: { anio: number; cuatrimestres: { cuatrimestre: number; progresos: any[] }[] }[] = [];
        for (const [anio, cmap] of [...map.entries()].sort((a, b) => a[0] - b[0])) {
            const cuatrimestres = [...cmap.entries()]
                .sort((a, b) => a[0] - b[0])
                .map(([cuatrimestre, progresos]) => ({ cuatrimestre, progresos }));
            result.push({ anio, cuatrimestres });
        }
        return result;
    }, [progresos]);

    if (progresos.length === 0) {
        return (
            <div className="text-center py-12 text-slate-400">
                No hay materias para mostrar
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {grouped.map((anio) => (
                <Accordion key={anio.anio} title={`${anio.anio}° Año`} defaultOpen={true}>
                    <div className="space-y-2">
                        {anio.cuatrimestres.map((cuat) => (
                            <Accordion
                                key={cuat.cuatrimestre}
                                title={`${cuat.cuatrimestre}° Cuatrimestre`}
                                defaultOpen={false}
                            >
                                <div className="space-y-1 pl-2">
                                    <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium text-slate-400">
                                        <div className="col-span-1 text-center">Nro</div>
                                        <div className="col-span-3 text-center">Materia</div>
                                        <div className="col-span-2 text-center">Código</div>
                                        <div className="col-span-1 text-center">Créd.</div>
                                        <div className="col-span-2 text-center">Estado</div>
                                        <div className="col-span-1 text-center">Nota</div>
                                        <div className="col-span-1 text-center">Tipo</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                    {cuat.progresos.map((progreso) => (
                                        <MateriaProgresoRow
                                            key={progreso.progresoId}
                                            materia={progreso.materia}
                                            progreso={progreso}
                                            onSave={onSave}
                                            isSaving={isSaving}
                                        />
                                    ))}
                                </div>
                            </Accordion>
                        ))}
                    </div>
                </Accordion>
            ))}
        </div>
    );
}
