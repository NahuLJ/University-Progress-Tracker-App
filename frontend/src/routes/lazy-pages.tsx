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
export const PlanificacionesPage = lazy(() => import('../pages/PlanificacionesPage'));
export const PlanificacionPage = lazy(() => import('../pages/PlanificacionPage'));
export const TrayectoriasPage = lazy(() => import('../pages/TrayectoriasPage'));
export const TrayectoriaPage = lazy(() => import('../pages/TrayectoriaPage'));
export const AdminPage = lazy(() =>
    import('../pages/AdminPage').then((m) => ({ default: m.AdminPage })),
);
export const CarreraEditPage = lazy(() =>
    import('../pages/CarreraEditPage').then((m) => ({ default: m.CarreraEditPage })),
);
export const MateriaDetailPage = lazy(() =>
    import('../pages/MateriaDetailPage').then((m) => ({ default: m.MateriaDetailPage })),
);
export const MateriaEditPage = lazy(() =>
    import('../pages/MateriaEditPage').then((m) => ({ default: m.MateriaEditPage })),
);
export const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

export const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
);