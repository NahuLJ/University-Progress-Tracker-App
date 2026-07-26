import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Trayectoria, NodoTrayectoria } from '../types/planificacion.types';

interface TrayectoriaState {
    trayectoriaActiva: Trayectoria | null;
    arbol: NodoTrayectoria | null;
    setTrayectoriaActiva: (t: Trayectoria | null) => void;
    setArbol: (n: NodoTrayectoria | null) => void;
    limpiar: () => void;
}

export const useTrayectoriaStore = create<TrayectoriaState>()(
    devtools(
        (set) => ({
            trayectoriaActiva: null,
            arbol: null,
            setTrayectoriaActiva: (t) => set({ trayectoriaActiva: t }),
            setArbol: (n) => set({ arbol: n }),
            limpiar: () => set({ trayectoriaActiva: null, arbol: null }),
        }),
        { name: 'trayectoria-store' },
    ),
);
