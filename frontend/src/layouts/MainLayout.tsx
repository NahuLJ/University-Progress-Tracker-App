import { Outlet, NavLink } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/auth.store';

export function MainLayout() {
    const logout = useAuthStore((s) => s.logout);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">Seguimiento Universitario</h1>
                        </div>
                        <nav className="flex items-center gap-4">
                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) =>
                                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`
                                }
                            >
                                Dashboard
                            </NavLink>
                            <NavLink
                                to="/carreras"
                                className={({ isActive }) =>
                                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`
                                }
                            >
                                Carreras
                            </NavLink>
                            <NavLink
                                to="/progreso"
                                className={({ isActive }) =>
                                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`
                                }
                            >
                                Progreso
                            </NavLink>
                            <NavLink
                                to="/planificacion"
                                className={({ isActive }) =>
                                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`
                                }
                            >
                                Planificación
                            </NavLink>
                            <NavLink
                                to="/admin"
                                className={({ isActive }) =>
                                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`
                                }
                            >
                                Admin
                            </NavLink>
                            <Button variant="ghost" size="sm" onClick={logout}>
                                Cerrar sesión
                            </Button>
                        </nav>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}