import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const LoginPage = lazy(() => import('../pages/LoginPage'));
export const RegisterPage = lazy(() => import('../pages/RegisterPage'));
export const DashboardPage = lazy(() => import('../pages/DashboardPage'));
export const CarrerasPage = lazy(() => import('../pages/CarrerasPage'));
export const CarreraDetailPage = lazy(() =>
    import('../pages/CarreraDetailPage').then((m) => ({ default: m.CarreraDetailPage })),
);
export const ProgresoPage = lazy(() => import('../pages/ProgresoPage'));
export const PlanificacionPage = lazy(() => import('../pages/PlanificacionPage'));
export const AdminPage = lazy(() =>
    import('../pages/AdminPage').then((m) => ({ default: m.AdminPage })),
);
export const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

export const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
);
