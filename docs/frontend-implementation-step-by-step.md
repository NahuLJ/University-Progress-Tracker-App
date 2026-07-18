# Frontend: Guía de Implementación Paso a Paso

Guía cronológica de "Cero a Experto" para construir el frontend React del sistema de seguimiento
universitario. Cada paso cita los archivos de documentación donde reside el código detallado.

> **Estado:** esta guía y las referencias (`docs/frontend/*.md`, `docs/frontend-guide.md`,
> `docs/security/jwt-auth-specification.md`) describen el **código ya implementado** en `frontend/`.
> Las versiones y la estructura de archivos coinciden con el repositorio actual. Las brechas conocidas
> (placeholders, datos mockeados) se señalan en cada paso y en `docs/frontend-guide.md`.

---

## Paso 1: Configuración Inicial del Entorno

Todo el frontend vive dentro de `frontend/`. El backend va en `backend/` — ambos separados en la raíz del repositorio.

### 1.1 Inicializar proyecto con Vite

```bash
# Desde la raíz del repositorio
npm create vite@latest frontend -- --template react-ts
cd frontend
```

Esto genera `frontend/` con TypeScript, Vite y configuración base de React. En el repositorio actual
se usa **Vite 8** + **React 19**.

### 1.2 Instalar todas las dependencias del stack

```bash
# Enrutamiento y estado de servidor / global
npm install react-router-dom @tanstack/react-query zustand

# Cliente HTTP (consumir API REST)
npm install axios

# Formularios y validación
npm install react-hook-form @hookform/resolvers zod

# Tailwind CSS v3
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p

# Utilidades de clases condicionales
npm install -D clsx tailwind-merge
```

> **Linting:** el proyecto usa **`oxlint`** (`npm run lint`), no ESLint. El `build` es
> `tsc -b && vite build` (no hay script `typecheck` aparte).

### 1.3 Archivos de configuración base

**.env** (en `frontend/`):

```env
VITE_API_URL=http://localhost:3000/api
```

**tailwind.config.ts** (contenido y paths de contenido):

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            // Espaciado, colores personalizados si aplica
        },
    },
    plugins: [],
} satisfies Config;
```

> Nota: el repo eliminó el `tailwind.config.js` duplicado (que tenía `content: []`) para que Tailwind
> lea este `.ts` y genere los estilos.

**vite.config.ts** — `@vitejs/plugin-react` presente, alias `@/* → src/*` y puerto 5173:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: { port: 5173 },
});
```

**tsconfig.app.json** — `compilerOptions.paths` permite el alias `@/*`:

```json
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": { "@/*": ["src/*"] }
    }
}
```

> En la práctica el código usa **imports relativos** (`../../hooks/...`); el alias está disponible pero
> no se usa de forma consistente.

### 1.4 Estructura final de carpetas

```
frontend/
├── .env
├── index.html / package.json / vite.config.ts
├── tailwind.config.ts / postcss.config.js
└── src/
    ├── main.tsx                   # Punto de entrada (monta <App />)
    ├── App.tsx                    # QueryClientProvider + AuthProvider + RouterProvider
    ├── routes/                    # index.tsx (router) + lazy-pages.tsx + PrivateRoute.tsx
    ├── layouts/                   # AuthLayout, MainLayout
    ├── context/                   # AuthContext.tsx (AuthProvider) + auth-context.ts + useAuth.ts
    ├── pages/                     # Login, Register, Dashboard, Carreras,
    │                              # CarreraDetail, Progreso, Planificacion
    ├── components/                # ui/, auth/, dashboard/, carrera/,
    │                              # progreso/, planificacion/, common/
    ├── hooks/                     # useAuthForm, useCarreras, usePlanEstudios,
    │                              # useProgreso, useDashboard, usePlanificacion
    ├── services/                  # api.ts + services por módulo
    ├── store/                     # auth.store.ts, planificacion.store.ts
    ├── types/                     # Interfaces y tipos por dominio
    └── utils/                     # constants, formato, cn, debounce, fortaleza
```

> **Referencia completa:** Ver `docs/frontend-guide.md` — Arquitectura y Estructura de Archivos para el árbol completo y la lista de componentes definidos vs. no implementados.

---

## Paso 2: Orden Estricto de Construcción (Roadmap)

Cada paso depende del anterior. No saltear.

| Orden | Componente/Página | Dependencia |
|-------|------------------|-------------|
| 1 | Router + Axios interceptor + Layouts + `App.tsx` | Ninguna |
| 2 | JWT: store (zustand) + `PrivateRoute` + `AuthContext` | Paso 1 |
| 3 | Login/Registro | Pasos 1, 2 |
| 4 | Plan de Estudios (Carreras + Materias) | Paso 2 (requiere auth) |
| 5 | Progreso Académico | Pasos 2, 4 |
| 6 | Planificador de Horarios | Pasos 2, 4, 5 |
| 7 | Dashboard de Estadísticas | Pasos 2, 5 |

> **Nota de estado:** los pasos 1–7 están implementados y funcionales. `DashboardPage` ya cablea
> `StatCards`/`Charts`/`CarrerasResumenList` con `useDashboard`; Progreso y Planificación resuelven la
> carrera activa vía `useCarreraActiva()` (ya no hay `usuarioCarreraId` hardcodeado); y la
> inscripción/desinscripción de carreras usa los hooks reales.

---

## Paso 3: Guía de Conexión y Citas por Componente

### 3.1 Router, Axios Interceptor y Layouts (Roadmap #1)

**Abrir y aplicar:**

- **`docs/frontend-guide.md`** → sección "Rutas de la Aplicación" — `createBrowserRouter` con `Suspense` + lazy loading para cada página y código de `PrivateRoute.tsx`.
- **`docs/security/jwt-auth-specification.md`** → sección "Frontend — Almacenamiento y Gestión del Token" — `services/api.ts` con interceptor request (adjunta Bearer token) y response (maneja 401 → logout).
- **`docs/frontend-guide.md`** → sección "Consumo de la API con Axios" — instancia Axios con interceptores.

**Esqueleto crítico (`src/services/api.ts`):**

```typescript
// Crear instancia axios con baseURL = import.meta.env.VITE_API_URL
// Request interceptor: leer token de authStore y setear Authorization header
// Response interceptor: en 401 → logout() + redirect a /login
```

```typescript
// src/routes/index.tsx
// createBrowserRouter con:
//   - AuthLayout → /login, /registro
//   - PrivateRoute + MainLayout → /dashboard, /carreras, /carreras/:id, /progreso, /planificacion
//   - Cada ruta usa React.lazy() + Suspense
```

```typescript
// src/App.tsx — QueryClientProvider + AuthProvider + RouterProvider
// src/layouts/MainLayout.tsx — Sidebar/Header con navegación + <Outlet />
// src/layouts/AuthLayout.tsx — Layout minimalista con <Outlet />
```

**Conexión con el paso anterior:** No hay paso anterior. Esto es la base del frontend. `App.tsx` arma
el `QueryClient` (staleTime 5 min, retry 1) y envuelve con `AuthProvider`.

### 3.2 Store de Autenticación + PrivateRoute + AuthContext (Roadmap #2)

**Abrir y aplicar:**

- **`docs/security/jwt-auth-specification.md`** → sección "AuthStore con zustand persist" — `store/auth.store.ts` con zustand persist + `isAuthenticated()` que decodifica el token para verificar expiración.
- **`docs/frontend-guide.md`** → sección "Manejo del Estado Global" → bloque "zustand — Sesión de Usuario".

**Esqueleto crítico:**

```typescript
// src/store/auth.store.ts
// zustand + persist (clave 'auth-storage') guardando token + usuario
// setAuth(token, usuario), logout(), isAuthenticated() (decodifica exp del JWT)
```

```typescript
// src/routes/PrivateRoute.tsx
// Lee token del authStore; si no hay (o expiró) → redirect a /login
```

```typescript
// src/context/AuthContext.tsx — AuthProvider (init de sesión)
// src/context/auth-context.ts — createContext (AuthContext) + AuthContextType
// src/context/useAuth.ts       — hook useAuth() que consume el context
```

**Conexión con el paso anterior:** El Router del paso 3.1 envuelve las rutas protegidas con `PrivateRoute`.
El interceptor del paso 3.1 usa `authStore.getState().token`.

### 3.3 Páginas de Login y Registro (Roadmap #3)

**Abrir y aplicar:**

- **`docs/frontend/login-registro-page.md`** — `useLoginForm()` / `useRegisterForm()` con Zod schemas, `LoginForm` y `RegisterForm`. Los campos de contraseña usan `PasswordInput` (toggle mostrar/ocultar) y la barra de fortaleza usa `utils/fortaleza.ts` (`calcularFortaleza`) con niveles Débil/Media/Buena/Fuerte.
- **`docs/security/jwt-auth-specification.md`** → sección de redirección post-login.
- **`docs/frontend-guide.md`** → sección "Estrategia para el Manejo de Formularios".

**Esqueleto crítico:**

```typescript
// src/hooks/useAuthForm.ts
// loginSchema, registerSchema con Zod
// useMutation → authService.login/register → onSuccess: setAuth + navigate('/dashboard')
```

```typescript
// src/services/auth.service.ts
// import api from './api';  api.post('/auth/login', data);  api.post('/auth/register', data);
```

**Conexión con el paso anterior:** Al registrarse/loguearse, llama a `authStore.setAuth()` del paso 3.2 y
redirige. Usa el `api` del paso 3.1.

> **Nota:** no existe `AuthCard.tsx`; el layout lo resuelven directamente `LoginPage`/`RegisterPage`.
> `MainLayout` usa `useAuthStore.logout()` para cerrar sesión (limpia el store y redirige a `/login`).

### 3.4 Plan de Estudios (Roadmap #4)

**Abrir y aplicar:**

- **`docs/frontend/plan-estudios-page.md`** — `CarrerasPage` (componente en `components/carrera/`, delegado desde `pages/CarrerasPage.tsx`) con lista + inscripción, `CarreraDetailPage` (en `pages/`) con `PlanEstudiosTree` (acordeones Año → Cuatrimestre → Materias), `MateriaDetailModal` con correlativas, hooks `useCarreras`, `usePlanEstudios`, `useInscribirCarrera`.
- **`docs/frontend-guide.md`** → sección "Estructura de Archivos" — Componentes bajo `components/carrera/` y `components/ui/`.

**Conexión con el paso anterior:** Requiere autenticación (PrivateRoute del paso 3.2). Consume
`GET /carreras/:id/plan-estudios` y las carreras del usuario vía `GET /usuarios/:id/carreras`.

> **Nota:** `InscribirCarreraModal` obtiene las carreras disponibles con `carrerasService.obtenerCarrerasDisponibles()`
> (filtra las ya inscriptas) e invoca `useInscribirCarrera`. En `CarrerasPage`, "Desinscribirse" usa
> `useDesinscribirCarrera` (con `confirm()` de confirmación).

### 3.5 Progreso Académico (Roadmap #5)

**Abrir y aplicar:**

- **`docs/frontend/progreso-academico-page.md`** — `ProgresoGrid` con filas, `MateriaProgresoRow` con React Hook Form + validación condicional (nota/tipo obligatorios en "Completada"), hook `useProgreso` con `useMutation` que invalida queries de estadísticas.

**Esqueleto crítico:**

```typescript
// src/hooks/useProgreso.ts
// useQuery(['progreso', usuarioCarreraId]) + useMutation con invalidateQueries(['progreso', ...], ['estadisticas'])
```

```typescript
// src/components/progreso/MateriaProgresoRow.tsx
// Formulario inline con React Hook Form; estado "Completada" muestra inputs de nota y tipo
```

**Conexión con el paso anterior:** El selector de carrera activa debería venir del paso 3.4. Cada fila de
progreso pertenece a una materia del plan de estudios.

> **Nota:** `ProgresoPage` resuelve la carrera activa con `useCarreraActiva()` (nombre y `usuarioCarreraId`
> reales; empty state si no hay carreras). Usa `FiltroEstado`/`FiltroBusqueda` (con debounce) y `ProgresoStatsBar`.
> Al marcar una materia como "Completada" sin nota/tipo, `MateriaProgresoRow` abre `CompletarMateriaModal`
> para confirmar nota (4–10) y tipo de aprobación antes de guardar.

### 3.6 Planificador de Horarios (Roadmap #6)

**Abrir y aplicar:**

- **`docs/frontend/planificador-horarios-page.md`** — `CalendarioSemanal` (grilla 7 bloques × 6 días), `BloqueHorarioCelda` con drag & drop nativo HTML5, `MateriaPlanificadaChip`, `MateriaDisponibleList` lateral, store zustand de planificación con `dirty` flag, hook `usePlanificacion` que sincroniza con React Query.
- **`docs/frontend-guide.md`** → sección "Calendario de Bloques Horarios" y store `planificacion.store.ts`.

**Esqueleto crítico:**

```typescript
// src/store/planificacion.store.ts
// Mapa celdas: key = "BLOQUE_ID-DIA", dirty flag, acciones asignar/quitar
```

```typescript
// src/components/planificacion/CalendarioSemanal.tsx
// Grid CSS grid-cols-[auto_repeat(6,1fr)] : 1 columna de horario + 6 días, 7 filas de bloques
```

**Conexión con el paso anterior:** Las materias disponibles se obtienen del progreso del paso 3.5
(filtrando las no completadas). La carrera activa viene del paso 3.4.

> **Nota:** `PlanificacionPage` resuelve la carrera activa con `useCarreraActiva()` (empty state si no hay carreras).

### 3.7 Dashboard de Estadísticas (Roadmap #7)

**Abrir y aplicar:**

- **`docs/frontend/dashboard-page.md`** — `DashboardPage` con selector multi-carrera, `PromedioCard`, `TiempoRestanteCard`, `CreditosCard`, `ProgresoBarCard` (en `StatCards.tsx`), `MateriasPorEstadoChart` y `EvolucionPromedioChart` (en `Charts.tsx`), `CarrerasResumenList`, hook `useDashboard` con queries paralelas de estadísticas.

**Conexión con el paso anterior:** El Dashboard consume datos del endpoint de estadísticas (respaldado por
el módulo de progreso del paso 3.5). Al cambiar de carrera en el selector, React Query refetch automáticamente.

> **Nota:** `DashboardPage` ya cablea `PromedioCard`/`TiempoRestanteCard`/`CreditosCard`/`ProgresoBarCard`,
> `MateriasPorEstadoChart`/`EvolucionPromedioChart` y `CarrerasResumenList` con los datos de `useDashboard`
> (`resumen`, `distribucion`, `evolucion`). El selector multi-carrera cambia `usuarioCarreraId` y React Query refetch.

---

## Paso 4: Pruebas Locales y Verificación

### 4.1 Ejecutar el servidor de desarrollo

```bash
cd frontend
npm run dev
```

Abrir en el navegador: `http://localhost:5173`. Asegurarse de que el backend esté corriendo en
`http://localhost:3000` (ver `backend/README.md` y `npm run db:setup`).

Comandos disponibles: `npm run dev`, `npm run build` (`tsc -b && vite build`), `npm run lint` (oxlint),
`npm run preview`.

> **Estado de calidad:** `npm run lint` pasa **sin warnings** y `npm run build` compila sin errores de
> TypeScript. Las páginas lazy viven en `routes/lazy-pages.tsx` y el context de auth está separado en
> `context/auth-context.ts` + `context/useAuth.ts` para cumplir `react/only-export-components`.

### 4.2 Checklist de flujos de usuario

#### Flujo de autenticación

- [ ] Acceder a `http://localhost:5173/dashboard` sin estar logueado → redirige a `/login`
- [ ] Hacer clic en "Registrate" → navega a `/registro`
- [ ] Registrarse con nombre, email, contraseña que cumple requisitos → redirige a `/dashboard`
- [ ] Verificar que la barra de fortaleza de contraseña (inline) se actualiza al escribir
- [ ] Intentar registrarse con email ya existente → ver mensaje de error rojo (`errors.root`)
- [x] Hacer logout → redirige a `/login`, token eliminado
- [x] Tratar de navegar a `/dashboard` tras logout → redirige a `/login`

#### Flujo de carreras y plan de estudios

- [x] Dashboard sin carreras → ver empty state con botón "Ver carreras"
- [x] Ir a `/carreras` → ver lista de carreras del usuario
- [x] Inscribirse a una carrera → el modal lista las carreras disponibles y crea la inscripción (refetch de "Mis Carreras")
- [x] Desinscribirse de una carrera → tras confirmar, desaparece de la lista
- [x] Click en una carrera → ver plan de estudios con acordeones Año → Cuatrimestre
- [x] Click en una materia → modal con info y correlativas

#### Flujo de progreso académico

- [x] Ir a `/progreso` → ver grilla con todas las materias
- [x] Cambiar estado de una materia → aparece botón "Guardar"
- [x] Marcar "Completada" → se habilitan campos de nota y tipo de aprobación
- [x] Guardar con nota 4-10 y tipo seleccionado → ver badge actualizado
- [x] Intentar marcar "Completada" sin nota/tipo → error de validación Zod en los campos
- [x] Filtrar por estado "Pendientes" → solo se ven las pendientes
- [x] Usar búsqueda por nombre → filtrado correcto
- [x] `CompletarMateriaModal` se abre al marcar "Completada" sin nota/tipo; `FiltroEstado`/`FiltroBusqueda` filtran la grilla

#### Flujo del planificador de horarios

- [x] Ir a `/planificacion` → ver calendario vacío (si no hay períodos)
- [x] Crear nueva planificación (año + instancia + nombre opcional)
- [x] Arrastrar materia desde lista lateral a una celda → chip aparece, materia desaparece de disponibles
- [x] Click en "×" del chip → materia vuelve a disponibles
- [x] Guardar planificación → envía solo novedades (`planificacionId === 0`)
- [x] Sin carreras registradas → ver empty state con botón "Ver carreras"

#### Flujo del dashboard

- [x] Una vez con progreso registrado, ir a `/dashboard` → ver promedio, créditos y progreso reales
- [x] Ver los gráficos de distribución de estados y evolución del promedio con datos del backend
- [x] Con más de una carrera, usar el selector → los datos se refrescan para la carrera elegida

#### Estados de carga y error

- [x] Mientras cargan datos → ver skeletons/spinners
- [x] Si la query falla (backend caído/error) → `QueryError` con mensaje y botón "Reintentar" en las páginas principales (Dashboard, Progreso, Carreras, CarreraDetail, Planificación, Admin)
- [x] Si el token expira → `isAuthenticated()` devuelve false → `PrivateRoute` redirige a `/login`
- [x] Datos vacíos → ver `EmptyState` con mensaje descriptivo
- [x] Ruta inválida → ver `NotFoundPage` (404) con botón "Volver al inicio"

### 4.3 Verificar integración JWT completa

1. Hardcodear un token expirado en localStorage (`auth-storage`) → recargar → debe redirigir a `/login`
2. Abrir en pestaña privada → acceder a ruta protegida → redirige a `/login`
3. Login exitoso → en localStorage aparece `auth-storage` con token y usuario
4. En cada request al backend, ver en DevTools Network que el header `Authorization: Bearer <token>` está presente
5. Si el backend responde 401 → el interceptor cierra sesión y redirige
