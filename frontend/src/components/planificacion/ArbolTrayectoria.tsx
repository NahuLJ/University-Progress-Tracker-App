import { useState, useRef } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { NodoTrayectoria, PeriodoPlanificacion } from '../../types/planificacion.types';

interface ArbolTrayectoriaProps {
    nodo: NodoTrayectoria;
    onNavigate: (periodoId: number) => void;
    onContinuar: (periodoId?: number) => void;
}

function PeriodoCard({
    periodo,
    onVerClick,
    onContinuarClick,
}: {
    periodo: PeriodoPlanificacion;
    onVerClick: () => void;
    onContinuarClick: () => void;
}) {
    const materiasUnicas = [...new Set(
        (periodo.materiasPlanificadas ?? []).map((mp) => mp.materia.nombre),
    )];

    return (
        <Card className="w-72 shrink-0 hover:bg-bg-surface-secondary transition-colors">
            <div className="flex flex-col h-full">
                <div className="flex items-start gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text-default truncate">
                            {periodo.nombre || `${periodo.anio} ${periodo.instancia}`}
                        </h3>
                    </div>
                    <Badge variant="info" size="sm" className="shrink-0 text-xs whitespace-nowrap">
                        {periodo.anio} {periodo.instancia}
                    </Badge>
                </div>

                <div className="text-sm text-text-subtle pb-4">
                    <span className="text-text-muted">Materias planificadas:</span>
                    {materiasUnicas.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                            {materiasUnicas.map((nombre) => (
                                <li key={nombre} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0" />
                                    {nombre}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-text-muted mt-1 italic">Sin materias planificadas</p>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-hairline flex gap-2">
                    <button
                        type="button"
                        onClick={onVerClick}
                        className="btn-primary flex-1"
                    >
                        Ver planificación
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onContinuarClick(); }}
                        className="btn-ghost"
                    >
                        + Continuar
                    </button>
                </div>
            </div>
        </Card>
    );
}

function NodoArbol({
    nodo,
    onNavigate,
    onContinuar,
}: {
    nodo: NodoTrayectoria;
    onNavigate: (periodoId: number) => void;
    onContinuar: (periodoId?: number) => void;
}) {
    if (!nodo.periodo) return null;

    const periodo = nodo.periodo;

    return (
        <div className="flex items-center gap-0 shrink-0">
            <PeriodoCard
                periodo={periodo}
                onVerClick={() => onNavigate(periodo.periodoId)}
                onContinuarClick={() => onContinuar(periodo.periodoId)}
            />

            {nodo.hijos.length > 0 && (
                <div className="flex items-stretch gap-0 shrink-0">
                    <div className="w-6 flex items-center">
                        <div className="w-full h-px bg-accent-primary/40" />
                    </div>

                    <div className="border-l-2 border-accent-primary/40 py-2 pl-4 flex flex-col gap-4 shrink-0">
                        {nodo.hijos.map((hijo, idx) => (
                            <div key={hijo.periodo?.periodoId ?? idx} className="flex items-center gap-0 shrink-0">
                                <div className="w-4 flex items-center">
                                    <div className="w-full h-px bg-accent-primary/40" />
                                </div>
                                <NodoArbol
                                    nodo={hijo}
                                    onNavigate={onNavigate}
                                    onContinuar={onContinuar}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function ArbolTrayectoria({ nodo, onNavigate, onContinuar }: ArbolTrayectoriaProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragInfo = useRef({ startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, moved: false });

    const handlePointerDown = (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        dragInfo.current = {
            startX: e.clientX - rect.left,
            startY: e.clientY - rect.top,
            scrollLeft: el.scrollLeft,
            scrollTop: el.scrollTop,
            moved: false,
        };

        const handleMove = (ev: PointerEvent) => {
            if (!containerRef.current) return;
            const r = containerRef.current.getBoundingClientRect();
            const mx = ev.clientX - r.left;
            const my = ev.clientY - r.top;
            const dx = mx - dragInfo.current.startX;
            const dy = my - dragInfo.current.startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
                dragInfo.current.moved = true;
                setIsDragging(true);
            }
            if (dragInfo.current.moved) {
                containerRef.current.scrollLeft = dragInfo.current.scrollLeft - dx;
                containerRef.current.scrollTop = dragInfo.current.scrollTop - dy;
                ev.preventDefault();
            }
        };

        const handleUp = () => {
            setIsDragging(false);
            document.removeEventListener('pointermove', handleMove);
            document.removeEventListener('pointerup', handleUp);
            document.removeEventListener('pointercancel', handleUp);
        };

        document.addEventListener('pointermove', handleMove);
        document.addEventListener('pointerup', handleUp);
        document.addEventListener('pointercancel', handleUp);
    };

    if (!nodo.periodo) return null;

    return (
        <div
            ref={containerRef}
            className={`overflow-auto scrollbar-none touch-none h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none pb-8`}
            onPointerDown={handlePointerDown}
        >
            <div className="inline-flex items-start gap-0 p-4 w-max min-w-full pr-16">
                <NodoArbol
                    nodo={nodo}
                    onNavigate={onNavigate}
                    onContinuar={onContinuar}
                />
            </div>
        </div>
    );
}
