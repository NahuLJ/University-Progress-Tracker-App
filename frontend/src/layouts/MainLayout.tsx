import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { CarreraSelector } from '../components/layout/CarreraSelector';
import { Snackbar } from '../components/ui/Snackbar';
import { useAuthStore } from '../store/auth.store';
import { useSidebarStore } from '../store/sidebar.store';

const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', icon: 'chart' as const },
    { to: '/carreras', label: 'Carreras', icon: 'school' as const },
    { to: '/progreso', label: 'Progreso', icon: 'graduation' as const },
    { to: '/planificacion', label: 'Planificación', icon: 'calendar' as const },
    { to: '/admin', label: 'Admin', icon: 'briefcase' as const },
];

function iniciales(nombre: string): string {
    return nombre
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('');
}

export function MainLayout() {
    const logout = useAuthStore((s) => s.logout);
    const usuario = useAuthStore((s) => s.usuario);
    const { collapsed, toggle } = useSidebarStore();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const alEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMobileOpen(false);
        };
        document.addEventListener('keydown', alEsc);
        return () => document.removeEventListener('keydown', alEsc);
    }, []);

    const sidebarContent = (
        <>
            <div className="h-16 flex items-center justify-between px-4 border-b border-base-600">
                {!collapsed && (
                    <span className="text-lg font-bold neon-text leading-tight">
                        Seguimiento Universitario
                    </span>
                )}
                <button
                    type="button"
                    onClick={toggle}
                    className="hidden md:inline-flex p-2 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                    title={collapsed ? 'Desplegar' : 'Contraer'}
                >
                    <Icon name="collapse" className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <div className={`p-3 border-b border-base-600 ${collapsed ? 'flex justify-center' : ''}`}>
                <CarreraSelector collapsed={collapsed} />
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                collapsed ? 'justify-center' : ''
                            } ${
                                isActive
                                    ? 'bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan'
                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                            }`
                        }
                    >
                        <Icon name={item.icon} className="w-5 h-5 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="p-3 border-t border-base-600">
                {!collapsed && usuario && (
                    <div className="flex items-center gap-3 mb-3 px-1">
                        <div className="w-9 h-9 rounded-full bg-neon-violet/15 text-neon-violet shadow-neon-violet flex items-center justify-center font-semibold text-sm shrink-0">
                            {iniciales(usuario.nombre)}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{usuario.nombre}</p>
                            <p className="text-xs text-slate-400 truncate">{usuario.email}</p>
                        </div>
                    </div>
                )}
                <button
                    type="button"
                    onClick={logout}
                    title={collapsed ? 'Cerrar sesión' : undefined}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 border-neon-red/60 text-neon-red bg-transparent hover:bg-neon-red/10 hover:shadow-[0_0_10px_rgba(248,113,113,0.8)] transition-all"
                >
                    <Icon name="close" className="w-4 h-4 shrink-0" />
                    {!collapsed && 'Cerrar sesión'}
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen flex">
            {/* Sidebar fijo en md+ */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 bg-base-900/90 backdrop-blur-md border-r border-base-600 flex-col hidden md:flex transition-[width] duration-300 ${
                    collapsed ? 'w-20' : 'w-64'
                }`}
            >
                {sidebarContent}
            </aside>

            {/* Overlay móvil */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar overlay en móvil */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 bg-base-900/95 backdrop-blur-md border-r border-base-600 flex flex-col w-64 transition-transform duration-300 md:hidden ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {sidebarContent}
            </aside>

            {/* Barra superior móvil */}
            <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-base-900/90 backdrop-blur-md border-b border-base-600 flex items-center justify-between px-4">
                <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="p-2 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white"
                    title="Abrir menú"
                >
                    <Icon name="menu" className="w-6 h-6" />
                </button>
                <span className="text-sm font-bold neon-text">Seguimiento Universitario</span>
                <div className="w-10" />
            </div>

            <main
                className={`flex-1 px-4 sm:px-6 lg:px-8 py-8 transition-[margin] duration-300 md:transition-none ${
                    collapsed ? 'md:ml-20' : 'md:ml-64'
                } pt-20 md:pt-8`}
            >
                <Outlet />
            </main>

            <Snackbar />
        </div>
    );
}
