import { Button } from '../ui/Button';
import type { NodoTrayectoria } from '../../types/planificacion.types';

interface ArbolTrayectoriaProps {
    nodo: NodoTrayectoria;
    onNavigate: (periodoId: number) => void;
    onContinuar: (periodoId?: number) => void;
    nivel?: number;
}

export function ArbolTrayectoria({ nodo, onNavigate, onContinuar, nivel = 0 }: ArbolTrayectoriaProps) {
    if (!nodo.periodo) return null;

    return (
        <div className="space-y-2" style={{ marginLeft: nivel > 0 ? `${nivel * 2}rem` : undefined }}>
            <div className={`flex items-center gap-3 p-3 rounded-lg ${nivel > 0 ? 'border-l-2 border-neon-cyan/30 ml-4' : ''} hover:bg-white/5 transition-colors`}>
                <div className={`w-2.5 h-2.5 rounded-full ${nivel === 0 ? 'bg-neon-cyan' : 'bg-neon-purple'}`} />
                <button
                    type="button"
                    onClick={() => onNavigate(nodo.periodo!.periodoId)}
                    className="flex-1 text-left"
                >
                    <span className="text-white font-medium">
                        {nodo.periodo.nombre || `${nodo.periodo.instancia} ${nodo.periodo.anio}`}
                    </span>
                    <span className="text-slate-400 text-sm ml-2">
                        ({nodo.periodo.materiasPlanificadas?.length ?? 0} materias)
                    </span>
                </button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onContinuar(nodo.periodo!.periodoId);
                    }}
                >
                    + Continuar
                </Button>
            </div>

            {nodo.hijos.length > 0 && (
                <div className="space-y-1">
                    {nodo.hijos.map((hijo, idx) => (
                        <ArbolTrayectoria
                            key={hijo.periodo?.periodoId ?? idx}
                            nodo={hijo}
                            onNavigate={onNavigate}
                            onContinuar={onContinuar}
                            nivel={nivel + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
