import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CarreraState {
    usuarioCarreraId: number | null;
    setUsuarioCarreraId: (id: number | null) => void;
}

export const useCarreraStore = create<CarreraState>()(
    persist(
        (set) => ({
            usuarioCarreraId: null,
            setUsuarioCarreraId: (id) => set({ usuarioCarreraId: id }),
        }),
        {
            name: 'carrera-activa-storage',
            partialize: (state) => ({ usuarioCarreraId: state.usuarioCarreraId }),
        },
    ),
);
