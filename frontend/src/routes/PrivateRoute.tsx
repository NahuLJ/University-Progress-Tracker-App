import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface PrivateRouteProps {
    children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
    const { token, isAuthenticated, logout } = useAuthStore();
    const location = useLocation();
    const [verificando, setVerificando] = useState(true);

    useEffect(() => {
        if (token && !isAuthenticated()) {
            logout();
        }
        setVerificando(false);
    }, [token, isAuthenticated, logout]);

    if (verificando) {
        return <LoadingSpinner />;
    }

    if (!token || !isAuthenticated()) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return <>{children}</>;
}