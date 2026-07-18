import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { MateriaEnCelda, MateriaDesbloqueable } from '../../types/planificacion.types';

const COLORES = [
    'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30',
    'bg-neon-green/15 text-neon-green border-neon-green/30',
    'bg-neon-violet/15 text-neon-violet border-neon-violet/30',
    'bg-neon-orange/15 text-neon-orange border-neon-orange/30',
    'bg-neon-pink/15 text-neon-pink border-neon-pink/30',
    'bg-neon-yellow/15 text-neon-yellow border-neon-yellow/30',
    'bg-neon-blue/15 text-neon-blue border-neon-blue/30',
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
            <div className="text-center py-8 text-slate-400">
                No hay materias nuevas por desbloquear
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="font-semibold">Materias que se desbloquearán</h3>
            <p className="text-sm text-slate-300 mb-4">
                Al completar las materias planificadas, también podrás cursar:
            </p>
            <div className="space-y-2">
                {materias.map((m: any) => (
                    <div key={m.materiaId} className="p-3 border border-base-600 rounded-lg">
                        <div className="font-medium text-slate-100">{m.nombre}</div>
                        <div className="text-sm text-slate-400">{m.codigo} • {m.creditos} créditos</div>
                        <div className="text-xs text-slate-500 mt-1">
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