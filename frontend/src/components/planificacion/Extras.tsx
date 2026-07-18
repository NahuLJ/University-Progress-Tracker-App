import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { MateriaEnCelda, MateriaDesbloqueable } from '../../types/planificacion.types';

const COLORES = [
    'bg-blue-100 text-blue-800 border-blue-300',
    'bg-green-100 text-green-800 border-green-300',
    'bg-purple-100 text-purple-800 border-purple-300',
    'bg-orange-100 text-orange-800 border-orange-300',
    'bg-pink-100 text-pink-800 border-pink-300',
    'bg-teal-100 text-teal-800 border-teal-300',
    'bg-indigo-100 text-indigo-800 border-indigo-300',
];

export function LeyendaHorarios({ materias }: { materias: MateriaEnCelda[] }) {
    if (!materias || materias.length === 0) return null;

    const materiasUnicas = materias.reduce((acc: MateriaEnCelda[], m: MateriaEnCelda) => {
        if (!acc.find((x) => x.materiaId === m.materiaId)) {
            acc.push(m);
        }
        return acc;
    }, []);

    return (
        <Card className="mt-4">
            <h3 className="font-semibold mb-3">Leyenda</h3>
            <div className="flex flex-wrap gap-2">
                {materiasUnicas.map((m: any, i: number) => (
                    <Badge
                        key={m.materiaId}
                        variant="default"
                        className={COLORES[i % COLORES.length]}
                    >
                        {m.nombre} ({m.codigo})
                    </Badge>
                ))}
            </div>
        </Card>
    );
}

export function MateriasDesbloqueablesList({ materias }: { materias: MateriaDesbloqueable[] }) {
    if (!materias || materias.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No hay materias nuevas por desbloquear
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="font-semibold">Materias que se desbloquearán</h3>
            <p className="text-sm text-gray-600 mb-4">
                Al completar las materias planificadas, también podrás cursar:
            </p>
            <div className="space-y-2">
                {materias.map((m: any) => (
                    <div key={m.materiaId} className="p-3 border border-gray-200 rounded-lg">
                        <div className="font-medium">{m.nombre}</div>
                        <div className="text-sm text-gray-500">{m.codigo} • {m.creditos} créditos</div>
                        <div className="text-xs text-gray-400 mt-1">
                            {m.correlativas.length === 0
                                ? 'Sin correlativas'
                                : `${m.correlativas.filter((c: { estado: string }) => c.estado !== 'Completada').length} correlativas faltantes`}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}