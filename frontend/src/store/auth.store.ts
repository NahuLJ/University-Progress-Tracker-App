import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Usuario {
    id: number;
    usuarioId?: number;
    nombre: string;
    email: string;
}

interface AuthState {
    token: string | null;
    usuario: Usuario | null;
    setAuth: (token: string, usuario: Usuario) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            usuario: null,
            setAuth: (token, usuario) => set({ token, usuario }),
            logout: () => {
                set({ token: null, usuario: null });
                window.location.href = '/login';
            },
            isAuthenticated: () => {
                const state = get();
                if (!state.token) return false;
                try {
                    const payload = JSON.parse(atob(state.token.split('.')[1]));
                    return payload.exp * 1000 > Date.now();
                } catch {
                    return false;
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                token: state.token,
                usuario: state.usuario,
            }),
            onRehydrateStorage: () => (state) => {
                if (state?.usuario && state.usuario.id === undefined && state.usuario.usuarioId !== undefined) {
                    state.usuario = {
                        ...state.usuario,
                        id: state.usuario.usuarioId,
                    };
                }
            },
        },
    )
);