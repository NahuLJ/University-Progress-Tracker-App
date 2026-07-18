import { MateriaProgresoRow } from './MateriaProgresoRow';
import { Card } from '../ui/Card';

interface ProgresoGridProps {
    progresos: any[];
    onSave: (id: number, data: any) => void;
    isSaving: boolean;
}

export function ProgresoGrid({ progresos, onSave, isSaving }: ProgresoGridProps) {
    if (progresos.length === 0) {
        return (
            <Card>
                <div className="text-center py-12">
                    <p className="text-gray-500">No hay materias para mostrar</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-600">
                <div className="col-span-3">Materia</div>
                <div className="col-span-2">Código</div>
                <div className="col-span-1 text-center">Créditos</div>
                <div className="col-span-2">Estado</div>
                <div className="col-span-1">Nota</div>
                <div className="col-span-2">Tipo</div>
                <div className="col-span-1"></div>
            </div>

            <div className="space-y-2">
                {progresos.map((progreso) => (
                    <MateriaProgresoRow
                        key={progreso.progresoId}
                        materia={progreso.materia}
                        progreso={progreso}
                        onSave={onSave}
                        isSaving={isSaving}
                    />
                ))}
            </div>
        </div>
    );
}