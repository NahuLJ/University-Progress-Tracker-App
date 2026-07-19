import { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { useCarreras } from '../../hooks/useCarreras';
import { useCarreraStore } from '../../store/carrera.store';

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

    if (!carreras || carreras.length <= 1) return null;

    const carreraActiva = carreras.find((c) => c.usuarioCarreraId === usuarioCarreraId);

    if (collapsed) {
        return (
            <div className="relative" ref={contenedorRef}>
                <button
                    type="button"
                    onClick={() => setAbierto((v) => !v)}
                    className="w-full flex items-center justify-center px-2 py-2 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white border border-base-600"
                    title={carreraActiva?.carrera?.nombre ?? 'Seleccionar carrera'}
                >
                    <Icon name="school" className="w-5 h-5 text-neon-cyan" />
                </button>

                {abierto && (
                    <div className="absolute left-full top-0 ml-2 w-60 z-50 card rounded-xl shadow-neon-cyan p-1.5 space-y-0.5">
                        <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Cambiar carrera
                        </p>
                        {carreras.map((c) => {
                            const activa = c.usuarioCarreraId === usuarioCarreraId;
                            return (
                                <button
                                    key={c.usuarioCarreraId}
                                    type="button"
                                    onClick={() => {
                                        setUsuarioCarreraId(c.usuarioCarreraId);
                                        setAbierto(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all truncate ${
                                        activa
                                            ? 'border-2 border-neon-cyan/60 text-neon-cyan bg-transparent shadow-[0_0_10px_rgba(34,211,238,0.8)]'
                                            : 'border-2 border-transparent text-slate-200 hover:bg-white/5 hover:text-white'
                                    }`}
                                    title={c.carrera?.nombre ?? ''}
                                >
                                    <span
                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                            activa ? 'bg-neon-cyan' : 'bg-slate-600'
                                        }`}
                                    />
                                    <span className="truncate">{c.carrera?.nombre ?? ''}</span>
                                </button>
                            );
                        })}
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
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-300 hover:bg-white/5 hover:text-white border border-base-600"
                title={carreraActiva?.carrera?.nombre ?? 'Seleccionar carrera'}
            >
                <Icon name="school" className="w-4 h-4 text-neon-cyan shrink-0" />
                <span className="flex-1 text-left truncate">
                    {carreraActiva?.carrera?.nombre ?? 'Carrera'}
                </span>
                <Icon
                    name="chevron"
                    className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${abierto ? 'rotate-180' : ''}`}
                />
            </button>

            {abierto && (
                <div className="absolute left-0 right-0 mt-2 z-50 card rounded-xl shadow-neon-cyan p-1.5 space-y-0.5">
                    <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Cambiar carrera
                    </p>
                    {carreras.map((c) => {
                        const activa = c.usuarioCarreraId === usuarioCarreraId;
                        return (
                            <button
                                key={c.usuarioCarreraId}
                                type="button"
                                onClick={() => {
                                    setUsuarioCarreraId(c.usuarioCarreraId);
                                    setAbierto(false);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all truncate ${
                                    activa
                                        ? 'border-2 border-neon-cyan/60 text-neon-cyan bg-transparent shadow-[0_0_10px_rgba(34,211,238,0.8)]'
                                        : 'border-2 border-transparent text-slate-200 hover:bg-white/5 hover:text-white'
                                }`}
                                title={c.carrera?.nombre ?? ''}
                            >
                                <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                        activa ? 'bg-neon-cyan' : 'bg-slate-600'
                                    }`}
                                />
                                <span className="truncate">{c.carrera?.nombre ?? ''}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
