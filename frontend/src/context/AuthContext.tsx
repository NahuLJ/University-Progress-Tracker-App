import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const { token, setAuth, logout, isAuthenticated } = useAuthStore();

    useEffect(() => {
        const initAuth = async () => {
            if (token && isAuthenticated()) {
                try {
                    const user = await authService.obtenerPerfil();
                    setAuth(token, user);
                } catch {
                    logout();
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, [token, setAuth, logout, isAuthenticated]);

    return (
        <AuthContext.Provider value={{ isLoading }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
}