import { useMemo, useState } from 'react';
import { MateriaProgresoRow } from './MateriaProgresoRow';
import { Accordion } from '../ui/Accordion';

interface ProgresoTreeProps {
    progresos: any[];
    onSave: (id: number, data: any) => void;
    isSaving: boolean;
    carreraId?: number;
    progresoMap?: Record<number, { estado: string; nota: number | null; tipoAprobacion: string | null }>;
}

export function ProgresoTree({ progresos, onSave, isSaving, carreraId, progresoMap }: ProgresoTreeProps) {
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

    const cuatKey = (anio: number, cuatrimestre: number) => `${anio}-${cuatrimestre}`;

    const [aniosOpen, setAniosOpen] = useState<Record<number, boolean>>({});
    const [cuatrimestresOpen, setCuatrimestresOpen] = useState<Record<string, boolean>>({});

    const expandirTodo = () => {
        const newAnios: Record<number, boolean> = {};
        const newCuatrimestres: Record<string, boolean> = {};
        grouped.forEach((anio) => {
            newAnios[anio.anio] = true;
            anio.cuatrimestres.forEach((cuat) => {
                newCuatrimestres[cuatKey(anio.anio, cuat.cuatrimestre)] = true;
            });
        });
        setAniosOpen(newAnios);
        setCuatrimestresOpen(newCuatrimestres);
    };

    const contraerTodo = () => {
        setAniosOpen({});
        setCuatrimestresOpen({});
    };

    if (progresos.length === 0) {
        return (
            <div className="text-center py-12 text-text-muted">
                No hay materias para mostrar
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2 mb-4">
                <button
                    type="button"
                    onClick={expandirTodo}
                    className="btn-ghost"
                >
                    Expandir todo
                </button>
                <button
                    type="button"
                    onClick={contraerTodo}
                    className="btn-danger"
                >
                    Contraer todo
                </button>
            </div>
            {grouped.map((anio) => (
                <Accordion key={anio.anio} title={`${anio.anio}° Año`} open={aniosOpen[anio.anio] ?? true} onOpenChange={(open) => setAniosOpen((prev) => ({ ...prev, [anio.anio]: open }))}>
                    <div className="space-y-2">
                        {anio.cuatrimestres.map((cuat) => (
                            <Accordion
                                key={cuatKey(anio.anio, cuat.cuatrimestre)}
                                title={`${cuat.cuatrimestre}° Cuatrimestre`}
                                open={cuatrimestresOpen[cuatKey(anio.anio, cuat.cuatrimestre)] ?? false}
                                onOpenChange={(open) => setCuatrimestresOpen((prev) => ({ ...prev, [cuatKey(anio.anio, cuat.cuatrimestre)]: open }))}
                            >
                                <div className="space-y-1 pl-2">
                                    <div className="grid grid-cols-12 gap-2 p-3 label">
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
                                            carreraId={carreraId}
                                            progresoMap={progresoMap}
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
