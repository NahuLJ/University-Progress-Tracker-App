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
    PlanificacionPage,
    NotFoundPage,
    AdminPage,
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
            { path: '/planificacion', element: <SuspenseWrapper><PlanificacionPage /></SuspenseWrapper> },
            { path: '/admin', element: <SuspenseWrapper><AdminPage /></SuspenseWrapper> },
        ],
    },
    { path: '*', element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper> },
]);