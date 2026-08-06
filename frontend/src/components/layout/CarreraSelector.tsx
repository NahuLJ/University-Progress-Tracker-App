import { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { useCarreras } from '../../hooks/useCarreras';
import { useCarreraStore } from '../../store/carrera.store';
import { usePlanificacionStore } from '../../store/planificacion.store';

interface CarreraSelectorProps {
    collapsed?: boolean;
}

export function CarreraSelector({ collapsed = false }: CarreraSelectorProps) {
    const { data: carreras } = useCarreras();
    const usuarioCarreraId = useCarreraStore((s) => s.usuarioCarreraId);
    const setUsuarioCarreraId = useCarreraStore((s) => s.setUsuarioCarreraId);

    const [abierto, setAbierto] = useState(false);
    const contenedorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!abierto) return;
        const alClicExterno = (e: MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                setAbierto(false);
            }
        };
        const alEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setAbierto(false);
        };
        document.addEventListener('mousedown', alClicExterno);
        document.addEventListener('keydown', alEsc);
        return () => {
            document.removeEventListener('mousedown', alClicExterno);
            document.removeEventListener('keydown', alEsc);
        };
    }, [abierto]);

    if (!carreras || carreras.length === 0) return null;

    const carreraActiva = carreras.find((c) => c.usuarioCarreraId === usuarioCarreraId);

    const opciones = (
        <>
            <p className="label px-3 py-1.5">Cambiar carrera</p>
            {carreras.map((c) => {
                const activa = c.usuarioCarreraId === usuarioCarreraId;
                return (
                    <button
                        key={c.usuarioCarreraId}
                        type="button"
                        onClick={() => {
                            setUsuarioCarreraId(c.usuarioCarreraId);
                            usePlanificacionStore.getState().limpiarStore();
                            setAbierto(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors truncate ${
                            activa
                                ? 'bg-accent-primary/10 text-accent-primary'
                                : 'text-text-default hover:bg-bg-surface-secondary'
                        }`}
                        title={c.carrera?.nombre ?? ''}
                    >
                        <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                                activa ? 'bg-accent-primary' : 'bg-slate-600'
                            }`}
                        />
                        <span className="truncate">{c.carrera?.nombre ?? ''}</span>
                    </button>
                );
            })}
        </>
    );

    if (collapsed) {
        return (
            <div className="relative" ref={contenedorRef}>
                <button
                    type="button"
                    onClick={() => setAbierto((v) => !v)}
                    className="w-full flex items-center justify-center px-2 py-2 rounded-md text-text-muted hover:bg-bg-surface-secondary hover:text-text-default border border-hairline"
                    title={carreraActiva?.carrera?.nombre ?? 'Seleccionar carrera'}
                >
                    <Icon name="school" className="w-5 h-5 text-accent-primary" />
                </button>

                {abierto && (
                    <div className="absolute left-full top-0 ml-2 w-60 z-50 card rounded-card p-1.5 space-y-0.5">
                        {opciones}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative" ref={contenedorRef}>
            <button
                type="button"
                onClick={() => setAbierto((v) => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-text-muted hover:bg-bg-surface-secondary hover:text-text-default border border-hairline"
                title={carreraActiva?.carrera?.nombre ?? 'Seleccionar carrera'}
            >
                <Icon name="school" className="w-4 h-4 text-accent-primary shrink-0" />
                <span className="flex-1 text-left truncate">
                    {carreraActiva?.carrera?.nombre ?? 'Carrera'}
                </span>
                <Icon
                    name="chevron"
                    className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${abierto ? 'rotate-180' : ''}`}
                />
            </button>

            {abierto && (
                <div className="absolute left-0 right-0 mt-2 z-50 card rounded-card p-1.5 space-y-0.5">
                    {opciones}
                </div>
            )}
        </div>
    );
}
