# Frontend Guide — Sistema de Seguimiento de Carreras Universitarias

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| Node.js | 20 LTS | Entorno de ejecución |
| npm | 10+ | Gestor de paquetes |
| React | 18.x | Librería de interfaz de usuario |
| Vite | 5.x | Bundler y dev server |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 3.x | Framework de estilos utilitario |
| React Router DOM | 6.x | Enrutamiento SPA |
| Axios | 1.x | Cliente HTTP para consumir la API |
| React Hook Form | 7.x | Manejo de formularios |
| Zod | 3.x | Esquemas de validación (wrap con @hookform/resolvers) |
| @tanstack/react-query | 5.x | Caching y estado del servidor |
| zustand | 4.x | Estado global liviano |

---

## Arquitectura y Estructura de Archivos

### Principios Arquitectónicos

- **Separación de capas**: páginas → hooks/services → API.
- **Estado global mínimo**: zustand se usa solo para estado de UI compartido (sesión, planificación en edición). Los datos del servidor se manejan con React Query (caching automático, refetch, loading states).
- **Componentes puros y reutilizables**: la carpeta `components/` contiene piezas atómicas sin dependencia directa de rutas.
- **Tipado compartido**: los tipos de las entidades y DTOs se definen en `types/` y se consumen tanto en services como en componentes.
- **Rutas lazy-loaded**: cada página se carga dinámicamente con `React.lazy()` para reducir el bundle inicial.

### Estructura de Archivos

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── .env                          # VITE_API_URL=http://localhost:3000/api
│
└── src/
    ├── main.tsx                  # Punto de entrada, renderiza <App />
    ├── App.tsx                   # Layout raíz + <RouterProvider />
    ├── vite-env.d.ts
    │
    ├── routes/
    │   ├── index.tsx             # Configuración de React Router (createBrowserRouter)
    │   └── PrivateRoute.tsx      # Componente wrapper que redirige a /login si no hay sesión
    │
    ├── layouts/
    │   ├── AuthLayout.tsx        # Layout minimalista para login/registro
    │   └── MainLayout.tsx        # Layout con sidebar, header y contenedor principal
    │
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── RegisterPage.tsx
    │   ├── DashboardPage.tsx
    │   ├── CarrerasPage.tsx
    │   ├── CarreraDetailPage.tsx # Plan de estudios de una carrera específica
    │   ├── ProgresoPage.tsx      # Progreso académico (estados + notas)
    │   └── PlanificacionPage.tsx # Planificación cuatrimestral con bloques horarios
    │
    ├── components/
    │   ├── ui/                   # Componentes atómicos reutilizables
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Select.tsx
    │   │   └── Input.tsx
    │   │
    │   ├── auth/
    │   │   ├── LoginForm.tsx
    │   │   └── RegisterForm.tsx
    │   │
    │   ├── dashboard/
    │   │   ├── PromedioCard.tsx
    │   │   ├── TiempoRestanteCard.tsx
    │   │   └── MateriasPorEstadoChart.tsx
    │   │
    │   ├── carrera/
    │   │   ├── CarreraCard.tsx
    │   │   ├── CarreraList.tsx
    │   │   ├── PlanEstudiosTable.tsx      # Tabla de materias con año/cuatrimestre/orden
    │   │   └── MateriaDetail.tsx          # Modal con info de materia + correlativas
    │   │
    │   ├── progreso/
    │   │   ├── MateriaProgresoRow.tsx     # Fila individual para cambiar estado/nota/tipo
    │   │   ├── FiltroEstado.tsx
    │   │   └── ProgresoGrid.tsx           # Grid de todas las materias del usuario
    │   │
    │   ├── planificacion/
    │   │   ├── PeriodoSelector.tsx        # Select de año + instancia (Verano, 1C, 2C)
    │   │   ├── CalendarioSemanal.tsx      # Grilla Lunes–Sábado con bloques de 08-22
    │   │   ├── BloqueHorarioCelda.tsx     # Celda individual de 2h en la grilla
    │   │   ├── MateriaPlanificadaChip.tsx # Chip de materia arrastrable dentro de un bloque
    │   │   └── MateriaDisponibleList.tsx  # Lista de materias pendientes para arrastrar
    │   │
    │   └── common/
    │       ├── LoadingSpinner.tsx
    │       ├── ErrorMessage.tsx
    │       └── EmptyState.tsx
    │
    ├── hooks/
    │   ├── useAuth.ts                    # Hook que consume el store de autenticación
    │   ├── useCarreras.ts                # useQuery para lista de carreras del usuario
    │   ├── usePlanEstudios.ts            # useQuery para materias de una carrera
    │   ├── useProgreso.ts                # useQuery + useMutation para estados/notas
    │   ├── useEstadisticas.ts            # useQuery para promedio y tiempo restante
    │   ├── usePlanificacion.ts           # useQuery + useMutation para períodos y horarios
    │   └── useBloquesHorarios.ts         # useQuery para catálogo de bloques
    │
    ├── services/
    │   ├── api.ts                        # Instancia de Axios (base URL, interceptor JWT)
    │   ├── auth.service.ts               # login(), register(), refresh()
    │   ├── carreras.service.ts           # getCarreras(), getPlanEstudios(), inscribir()
    │   ├── materias.service.ts           # getMaterias(), getCorrelativas()
    │   ├── progreso.service.ts           # getProgreso(), actualizarProgreso()
    │   ├── estadisticas.service.ts       # getResumen()
    │   └── planificacion.service.ts      # getPeriodos(), crearPeriodo(), planificarMateria()
    │
    ├── store/
    │   ├── auth.store.ts                 # zustand: token, usuario actual, login/logout
    │   └── planificacion.store.ts        # zustand: período activo en edición, materias seleccionadas
    │
    ├── types/
    │   ├── auth.types.ts
    │   ├── carrera.types.ts
    │   ├── materia.types.ts
    │   ├── progreso.types.ts
    │   ├── estadisticas.types.ts
    │   ├── planificacion.types.ts
    │   └── api.types.ts                  # Genéricos ApiResponse<T>, PaginatedResponse<T>
    │
    └── utils/
        ├── constants.ts                  # BLOQUES_HORARIOS, DIAS_SEMANA, ESTADOS
        ├── formato.ts                    # formatearFecha, formatearPromedio, etc.
        └── cn.ts                         # Utilidad clsx + tailwind-merge para clases condicionales
```

---

## Detalles Críticos para la Implementación

### 1. Manejo del Estado Global

Se usan dos herramientas complementarias: **zustand** para estado de UI compartido y **React Query** para datos del servidor.

#### zustand — Sesión de Usuario

```typescript
// store/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    token: string | null;
    usuario: { id: number; nombre: string; email: string } | null;
    setAuth: (token: string, usuario: { id: number; nombre: string; email: string }) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            usuario: null,
            setAuth: (token, usuario) => set({ token, usuario }),
            logout: () => set({ token: null, usuario: null }),
        }),
        { name: 'auth-storage' }
    )
);
```

#### zustand — Planificación en Edición

```typescript
// store/planificacion.store.ts
import { create } from 'zustand';

interface PlanificacionState {
    periodoActivo: { periodoId: number; anio: number; instancia: string } | null;
    materiasSeleccionadas: Map<string, number>; // "LUNES-1" → materiaId
    setPeriodoActivo: (periodo: PlanificacionState['periodoActivo']) => void;
    asignarMateria: (key: string, materiaId: number) => void;
    quitarMateria: (key: string) => void;
}

export const usePlanificacionStore = create<PlanificacionState>((set) => ({
    periodoActivo: null,
    materiasSeleccionadas: new Map(),
    setPeriodoActivo: (periodo) => set({ periodoActivo: periodo }),
    asignarMateria: (key, materiaId) =>
        set((state) => {
            const nuevo = new Map(state.materiasSeleccionadas);
            nuevo.set(key, materiaId);
            return { materiasSeleccionadas: nuevo };
        }),
    quitarMateria: (key) =>
        set((state) => {
            const nuevo = new Map(state.materiasSeleccionadas);
            nuevo.delete(key);
            return { materiasSeleccionadas: nuevo };
        }),
}));
```

#### React Query — Datos del Servidor

```typescript
// hooks/useProgreso.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progresoService } from '../services/progreso.service';

export function useProgreso(usuarioCarreraId: number) {
    return useQuery({
        queryKey: ['progreso', usuarioCarreraId],
        queryFn: () => progresoService.getProgreso(usuarioCarreraId),
    });
}

export function useActualizarProgreso() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            progresoService.actualizarProgreso(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['progreso'] });
            queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
        },
    });
}
```

### 2. Consumo de la API con Axios

Una sola instancia de Axios con interceptores inyecta el token JWT automáticamente y maneja errores globales.

```typescript
// services/api.ts
import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
```

### 3. Componentes Reutilizables — Calendario de Bloques Horarios

El componente `CalendarioSemanal` renderiza una grilla de 7 bloques (08-10, 10-12, …, 20-22) × 6 días (Lunes–Sábado). Cada celda soporta drag & drop para asignar materias.

```typescript
// components/planificacion/CalendarioSemanal.tsx
import { usePlanificacionStore } from '../../store/planificacion.store';
import { BloqueHorarioCelda } from './BloqueHorarioCelda';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const BLOQUES = [
    { id: 1, inicio: '08:00', fin: '10:00' },
    { id: 2, inicio: '10:00', fin: '12:00' },
    { id: 3, inicio: '12:00', fin: '14:00' },
    { id: 4, inicio: '14:00', fin: '16:00' },
    { id: 5, inicio: '16:00', fin: '18:00' },
    { id: 6, inicio: '18:00', fin: '20:00' },
    { id: 7, inicio: '20:00', fin: '22:00' },
];

export function CalendarioSemanal() {
    const asignarMateria = usePlanificacionStore((s) => s.asignarMateria);

    const handleDrop = (bloqueId: number, dia: string, materiaId: number) => {
        const key = `${dia.toUpperCase()}-${bloqueId}`;
        asignarMateria(key, materiaId);
    };

    return (
        <div className="grid grid-cols-[auto_repeat(6,1fr)] gap-1">
            <div className="font-semibold p-2">Horario</div>
            {DIAS.map((dia) => (
                <div key={dia} className="font-semibold p-2 text-center">{dia}</div>
            ))}
            {BLOQUES.map((bloque) => (
                <>
                    <div key={bloque.id} className="p-2 text-sm text-gray-500">
                        {bloque.inicio} – {bloque.fin}
                    </div>
                    {DIAS.map((dia) => (
                        <BloqueHorarioCelda
                            key={`${dia}-${bloque.id}`}
                            bloqueId={bloque.id}
                            dia={dia}
                            onDrop={(materiaId) => handleDrop(bloque.id, dia, materiaId)}
                        />
                    ))}
                </>
            ))}
        </div>
    );
}
```

### 4. Estrategia para el Manejo de Formularios

Se usa **React Hook Form** + **Zod** para formularios tipados con validación declarativa.

```typescript
// components/progreso/MateriaProgresoRow.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const progresoSchema = z.object({
    estado: z.enum(['Pendiente', 'En Proceso', 'Completada']),
    nota: z.number().int().min(4).max(10).optional(),
    tipoAprobacion: z.enum(['Final', 'Promocion']).optional(),
}).refine(
    (data) => data.estado !== 'Completada' || (data.nota !== undefined && data.tipoAprobacion !== undefined),
    { message: 'Nota y tipo de aprobación son obligatorios al completar la materia' }
);

type ProgresoFormData = z.infer<typeof progresoSchema>;

export function MateriaProgresoRow({ materia, progreso, onSave }: Props) {
    const { register, handleSubmit, watch, formState: { errors } } = useForm<ProgresoFormData>({
        resolver: zodResolver(progresoSchema),
        defaultValues: {
            estado: progreso?.estado ?? 'Pendiente',
            nota: progreso?.nota,
            tipoAprobacion: progreso?.tipoAprobacion,
        },
    });

    const estadoActual = watch('estado');

    return (
        <form onSubmit={handleSubmit(onSave)} className="flex items-center gap-4 p-2">
            <span className="w-48 font-medium">{materia.nombre}</span>

            <select {...register('estado')} className="border rounded p-1">
                <option value="Pendiente">Pendiente</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Completada">Completada</option>
            </select>

            {estadoActual === 'Completada' && (
                <>
                    <input type="number" {...register('nota', { valueAsNumber: true })}
                        placeholder="Nota (4-10)" className="border rounded p-1 w-20" />
                    <select {...register('tipoAprobacion')} className="border rounded p-1">
                        <option value="">Tipo</option>
                        <option value="Final">Final</option>
                        <option value="Promocion">Promoción</option>
                    </select>
                </>
            )}

            <Button type="submit">Guardar</Button>
            {errors.nota && <span className="text-red-500 text-sm">{errors.nota.message}</span>}
        </form>
    );
}
```

---

## Rutas de la Aplicación

Todas las rutas se definen centralizadamente en `routes/index.tsx` usando `createBrowserRouter` de React Router DOM v6.

| Ruta | Página | Descripción | Acceso |
|---|---|---|---|
| `/login` | `LoginPage` | Formulario de inicio de sesión (email + password). Redirige a `/dashboard` si ya hay sesión activa. | Público |
| `/registro` | `RegisterPage` | Formulario de registro de nuevo usuario. | Público |
| `/dashboard` | `DashboardPage` | Pantalla principal con tarjetas de **promedio general**, **tiempo estimado para recibirse** y **distribución de materias por estado**. Muestra las carreras activas del usuario. | Privado |
| `/carreras` | `CarrerasPage` | Lista de carreras en las que el usuario está inscripto. Opción para inscribirse a una nueva carrera. | Privado |
| `/carreras/:id` | `CarreraDetailPage` | **Plan de estudios** de una carrera específica. Tabla con año, cuatrimestre, orden y nombre de cada materia. Al hacer clic en una materia se muestra un modal con sus **correlativas** y detalles. | Privado |
| `/progreso` | `ProgresoPage` | **Progreso académico**. Grilla con todas las materias del plan de estudios del usuario. Por cada materia se puede cambiar el estado (Pendiente/En Proceso/Completada). Al seleccionar "Completada" se habilitan los campos de **nota** y **tipo de aprobación** (Final / Promoción). | Privado |
| `/progreso?carrera=:id` | `ProgresoPage` | Variante de la misma pantalla filtrada por una carrera específica. | Privado |
| `/planificacion` | `PlanificacionPage` | **Planificación cuatrimestral**. Selector de año e instancia (Verano, 1.er Cuatrimestre, 2.º Cuatrimestre). Grilla interactiva de **Lunes a Sábado** con bloques fijos de **08:00 a 22:00** en segmentos de 2 horas. Las materias pendientes se arrastran desde una lista lateral a las celdas de la grilla. Soporte para múltiples planificaciones por período con nombre distintivo. | Privado |

### Configuración del Router

```typescript
// routes/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { PrivateRoute } from './PrivateRoute';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const CarrerasPage = lazy(() => import('../pages/CarrerasPage'));
const CarreraDetailPage = lazy(() => import('../pages/CarreraDetailPage'));
const ProgresoPage = lazy(() => import('../pages/ProgresoPage'));
const PlanificacionPage = lazy(() => import('../pages/PlanificacionPage'));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
);

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
        ],
    },
    { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
```

### Componente PrivateRoute

```typescript
// routes/PrivateRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((state) => state.token);
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
```

---

## Comandos de Inicialización

```bash
# Crear el proyecto con Vite
npm create vite@latest frontend -- --template react-ts

# Dependencias principales
npm install react-router-dom axios @tanstack/react-query zustand
npm install react-hook-form @hookform/resolvers zod

# Tailwind CSS
npm install -D tailwindcss @tailwindcss/vite
# Configurar tailwind.config.ts y postcss.config.js

# Utilidades (opcional)
npm install -D clsx tailwind-merge
```
