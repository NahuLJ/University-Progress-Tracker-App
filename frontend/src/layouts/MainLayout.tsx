import { Outlet, NavLink } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/auth.store';

export function MainLayout() {
    const logout = useAuthStore((s) => s.logout);

    return (
        <div className="min-h-screen">
            <header className="sticky top-0 z-40 bg-base-900/80 backdrop-blur-md border-b border-base-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold neon-text">Seguimiento Universitario</span>
                        </div>
                        <nav className="flex items-center gap-2">
                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) =>
                                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan'
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
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
                                            ? 'bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan'
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
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
                                            ? 'bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan'
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
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
                                            ? 'bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan'
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
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
                                            ? 'bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan'
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
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