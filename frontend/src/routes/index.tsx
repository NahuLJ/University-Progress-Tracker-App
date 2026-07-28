import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { PrivateRoute } from './PrivateRoute';
import {
    LoginPage,
    RegisterPage,
    DashboardPage,
    CarrerasPage,
    CarreraDetailPage,
    ProgresoPage,
    PlanificacionesPage,
    PlanificacionPage,
    TrayectoriasPage,
    TrayectoriaPage,
    NotFoundPage,
    AdminPage,
    CarreraEditPage,
    MateriaDetailPage,
    MateriaEditPage,
    SuspenseWrapper,
} from './lazy-pages';

export const router = createBrowserRouter([
    {
        element: <AuthLayout />,
        children: [
            { path: '/login', element: <SuspenseWrapper><LoginPage /></SuspenseWrapper> },
            { path: '/registro', element: <SuspenseWrapper><RegisterPage /></SuspenseWrapper> },
        ],
    },
    {
        element: <PrivateRoute><MainLayout /></PrivateRoute>,
        children: [
            { index: true, element: <Navigate to="/dashboard" replace /> },
            { path: '/dashboard', element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> },
            { path: '/carreras', element: <SuspenseWrapper><CarrerasPage /></SuspenseWrapper> },
            { path: '/carreras/:id', element: <SuspenseWrapper><CarreraDetailPage /></SuspenseWrapper> },
            { path: '/progreso', element: <SuspenseWrapper><ProgresoPage /></SuspenseWrapper> },
            { path: '/planificaciones', element: <SuspenseWrapper><PlanificacionesPage /></SuspenseWrapper> },
            { path: '/planificacion/:id', element: <SuspenseWrapper><PlanificacionPage /></SuspenseWrapper> },
            { path: '/trayectorias', element: <SuspenseWrapper><TrayectoriasPage /></SuspenseWrapper> },
            { path: '/trayectoria/:id', element: <SuspenseWrapper><TrayectoriaPage /></SuspenseWrapper> },
            { path: '/admin', element: <SuspenseWrapper><AdminPage /></SuspenseWrapper> },
            { path: '/admin/carreras/:id/editar', element: <SuspenseWrapper><CarreraEditPage /></SuspenseWrapper> },
            { path: '/admin/materias/:id', element: <SuspenseWrapper><MateriaDetailPage /></SuspenseWrapper> },
            { path: '/admin/materias/:id/editar', element: <SuspenseWrapper><MateriaEditPage /></SuspenseWrapper> },
        ],
    },
    { path: '*', element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper> },
]);