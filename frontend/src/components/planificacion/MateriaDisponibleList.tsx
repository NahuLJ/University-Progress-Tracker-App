import { Card } from '../ui/Card';

interface MateriaDisponibleListProps {
    materias: any[];
}

export function MateriaDisponibleList({ materias }: MateriaDisponibleListProps) {
    if (materias.length === 0) {
        return (
            <Card>
                <h3 className="font-semibold mb-3">Materias disponibles</h3>
                <p className="text-gray-500 text-sm">No hay materias pendientes para planificar</p>
            </Card>
        );
    }

    return (
        <Card>
            <h3 className="font-semibold mb-3">Materias disponibles</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {materias.map((materia) => (
                    <div
                        key={materia.materiaId}
                        className="p-3 border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing hover:bg-gray-50 transition-colors"
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.setData('materiaId', materia.materiaId.toString());
                            e.dataTransfer.effectAllowed = 'move';
                        }}
                    >
                        <div className="font-medium text-sm">{materia.nombre}</div>
                        <div className="text-xs text-gray-500">{materia.codigo} • {materia.creditos} créditos</div>
                    </div>
                ))}
            </div>
        </Card>
    );
}