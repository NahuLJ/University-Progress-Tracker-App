# Frontend: Guía de Implementación Paso a Paso

Guía cronológica de "Cero a Experto" para construir el frontend React del sistema de seguimiento universitario. Cada paso cita los archivos de documentación donde reside el código detallado.

---

## Paso 1: Configuración Inicial del Entorno

Todo el frontend vive dentro de `frontend/`. El backend va en `backend/` — ambos separados en la raíz del repositorio.

### 1.1 Inicializar proyecto con Vite

```bash
# Desde la raíz del repositorio
npm create vite@latest frontend -- --template react-ts
cd frontend
```

Esto genera `frontend/` con TypeScript, Vite 5 y configuración base de React 18.

### 1.2 Instalar todas las dependencias del stack

```bash
# Enrutamiento y estado global
npm install react-router-dom @tanstack/react-query zustand

# Cliente HTTP (consumir API REST)
npm install axios

# Formularios y validación
npm install react-hook-form @hookform/resolvers zod

# Tailwind CSS v3
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p

# Utilidades de clases condicionales (opcional)
npm install -D clsx tailwind-merge
```

### 1.3 Archivos de configuración base

**.env** (en `frontend/`):

```env
VITE_API_URL=http://localhost:3000/api
```

**tailwind.config.ts** (contenido de postcss.config.js y paths de contenido):

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

**vite.config.ts** — Verificar que el `@vitejs/plugin-react` esté presente. Configurar el puerto si es necesario (por defecto 5173).

**tsconfig.json** — Verificar que `compilerOptions.paths` permita imports absolutos desde `src/`:

```json
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": { "@/*": ["src/*"] }
    }
}
```

### 1.4 Estructura final de carpetas

```
frontend/
├── .env
├── index.html / package.json / vite.config.ts
├── tailwind.config.ts / postcss.config.js
└── src/
    ├── main.tsx                   # Punto de entrada
    ├── App.tsx                    # Layout raíz + RouterProvider
    ├── routes/                    # Configuración de router + PrivateRoute
    ├── layouts/                   # AuthLayout, MainLayout
    ├── pages/                     # Login, Register, Dashboard, Carreras,
    │                              # CarreraDetail, Progreso, Planificacion
    ├── components/                # ui/, auth/, dashboard/, carrera/,
    │                              # progreso/, planificacion/, common/
    ├── hooks/                     # useAuth, useCarreras, useProgreso, etc.
    ├── services/                  # api.ts + services por módulo
    ├── store/                     # auth.store.ts, planificacion.store.ts
    ├── types/                     # Interfaces y tipos por dominio
    └── utils/                     # constantes, formatos, cn()
```

> **Referencia completa:** Ver `docs/frontend-guide.md` — Arquitectura y Estructura de Archivos para el árbol completo.

---

## Paso 2: Orden Estricto de Construcción (Roadmap)

Cada paso depende del anterior. No saltear.

| Orden | Componente/Página | Dependencia |
|-------|------------------|-------------|
| 1 | Router + Axios interceptor + Layouts | Ninguna |
| 2 | JWT: store (zustand) + PrivateRoute | Paso 1 |
| 3 | Login/Registro | Pasos 1, 2 |
| 4 | Plan de Estudios (Carreras + Materias) | Paso 2 (requiere auth) |
| 5 | Progreso Académico | Pasos 2, 4 |
| 6 | Planificador de Horarios | Pasos 2, 4, 5 |
| 7 | Dashboard de Estadísticas | Pasos 2, 5 |

---

## Paso 3: Guía de Conexión y Citas por Componente

### 3.1 Router, Axios Interceptor y Layouts (Roadmap #1)

**Abrir y aplicar:**

- **`docs/frontend-guide.md`** sección "Rutas de la Aplicación" (líneas 394–471) — Configuración de `createBrowserRouter` con `Suspense` + lazy loading para cada página. Código de `PrivateRoute.tsx`.
- **`docs/security/jwt-auth-specification.md`** sección "Frontend — Almacenamiento y Gestión del Token" (líneas 183–405) — Código de `services/api.ts` con interceptor request (adjunta Bearer token) y response (maneja 401 → logout).
- **`docs/frontend-guide.md`** sección 2 — Código de `services/api.ts` (líneas 246–273), instancia Axios con interceptores.

**Código base de interconexión (esqueleto crítico):**

```typescript
// src/services/api.ts — Ver código exacto en frontend-guide.md (líneas 246-273)
// y jwt-auth-specification.md (líneas 247-290)
// Debe:
//   1. Crear instancia axios con baseURL = import.meta.env.VITE_API_URL
//   2. Request interceptor: leer token de authStore y setear Authorization header
//   3. Response interceptor: en 401 → logout() + redirect a /login
```

```typescript
// src/routes/index.tsx — Ver código exacto en frontend-guide.md (líneas 411-452)
// createBrowserRouter con:
//   - AuthLayout → /login, /registro
//   - PrivateRoute + MainLayout → /dashboard, /carreras, /carreras/:id, /progreso, /planificacion
//   - Cada ruta usa React.lazy() + Suspense
```

```typescript
// src/layouts/MainLayout.tsx — Sidebar/Header con navegación + <Outlet />
// src/layouts/AuthLayout.tsx — Layout minimalista con <Outlet />
```

**Conexión con el paso anterior:** No hay paso anterior. Esto es la base del frontend.

### 3.2 Store de Autenticación + PrivateRoute (Roadmap #2)

**Abrir y aplicar:**

- **`docs/security/jwt-auth-specification.md`** sección 1 — Código de `store/auth.store.ts` con zustand persist + `isAuthenticated()` que decodifica el token para verificar expiración (líneas 194–242).
- **`docs/frontend-guide.md`** sección 1.1 — Store de sesión con zustand (líneas 156–178).

**Código base de interconexión (esqueleto crítico):**

```typescript
// src/store/auth.store.ts — Ver código en jwt-auth-specification.md (líneas 194-242)
// Usar zustand persist middleware para guardar token en localStorage
// Incluir método isAuthenticated() que verifica exp del token localmente
```

```typescript
// src/routes/PrivateRoute.tsx — Ver código en frontend-guide.md (líneas 457-471)
// y jwt-auth-specification.md (líneas 324-353)
// Debe: verificar token, si expirado → logout, si no hay token → redirect a /login
```

**Conexión con el paso anterior:** El Router del paso 3.1 envuelve las rutas protegidas con `PrivateRoute`. El interceptor del paso 3.1 usa `authStore.getState().token`.

### 3.3 Páginas de Login y Registro (Roadmap #3)

**Abrir y aplicar:**

- **`docs/frontend/login-registro-page.md`** — `useLoginForm()` y `useRegisterForm()` hooks con Zod schemas, `LoginForm` y `RegisterForm` con barra de fortaleza de contraseña, AuthLayout como contenedor.
- **`docs/security/jwt-auth-specification.md`** sección 5 — Redirección post-login a la ruta original (`location.state.from`).
- **`docs/frontend-guide.md`** sección 3 — Manejo de formularios con React Hook Form + Zod (referencia conceptual).

**Código base de interconexión (esqueleto crítico):**

```typescript
// src/hooks/useAuthForm.ts — Ver código exacto en login-registro-page.md (líneas 52-134)
// loginSchema, registerSchema con Zod
// useMutation → authService.login/register → onSuccess: setAuth + navigate
```

```typescript
// src/services/auth.service.ts — Ver en jwt-auth-specification.md (líneas 295-319)
// import api from './api';  api.post('/auth/login', data);
```

**Conexión con el paso anterior:** Al registrarse/loguearse, llama a `authStore.setAuth()` del paso 3.2 y redirige. Usa el `api` del paso 3.1.

### 3.4 Plan de Estudios (Roadmap #4)

**Abrir y aplicar:**

- **`docs/frontend/plan-estudios-page.md`** — `CarrerasPage` (lista + inscripción), `CarreraDetailPage` con `PlanEstudiosTree` (acordeones Año → Cuatrimestre → Materias), `MateriaDetailModal` con correlativas, hooks `useCarreras`, `usePlanEstudios`, `useInscribirCarrera`.
- **`docs/frontend-guide.md`** sección "Estructura de Archivos" — Componentes bajo `components/carrera/` y `components/ui/`.

**Conexión con el paso anterior:** Requiere autenticación (PrivateRoute del paso 3.2). Usa el token del store para consumir `GET /api/carreras`, `GET /api/carreras/:id/plan-estudios`.

### 3.5 Progreso Académico (Roadmap #5)

**Abrir y aplicar:**

- **`docs/frontend/progreso-academico-page.md`** — `ProgresoGrid` con filas inline editables, `MateriaProgresoRow` con React Hook Form + validación condicional (nota/tipo obligatorios en "Completada"), `CompletarMateriaModal`, filtros por estado y búsqueda con debounce, hook `useProgreso` con useMutation que invalida queries de estadísticas.

**Código base de interconexión (esqueleto crítico):**

```typescript
// src/hooks/useProgreso.ts — Ver código exacto en progreso-academico-page.md (líneas 67-117)
// useQuery(['progreso', usuarioCarreraId]) + useMutation con invalidateQueries
```

```typescript
// src/components/progreso/MateriaProgresoRow.tsx — Ver código exacto en progreso-academico-page.md (líneas 124-226)
// Formulario inline con React Hook Form, estado "Completada" muestra inputs de nota y tipo
```

**Conexión con el paso anterior:** El selector de carrera activa viene del paso 3.4. Cada fila de progreso pertenece a una materia del plan de estudios.

### 3.6 Planificador de Horarios (Roadmap #6)

**Abrir y aplicar:**

- **`docs/frontend/planificador-horarios-page.md`** — `CalendarioSemanal` (grilla 7 bloques × 6 días), `BloqueHorarioCelda` con drag & drop, `MateriaPlanificadaChip` con colores por materia, `MateriaDisponibleList` lateral, store zustand de planificación con dirty flag, hook `usePlanificacion` que sincroniza con React Query.
- **`docs/frontend-guide.md`** sección 3 — Código de `CalendarioSemanal` (líneas 279–327) y store `planificacion.store.ts` (líneas 183–211).

**Código base de interconexión (esqueleto crítico):**

```typescript
// src/store/planificacion.store.ts — Ver código en planificador-horarios-page.md (líneas 92-181)
// Mapa celdas: key = "BLOQUE_ID-DIA", dirty flag, acciones asignar/quitar
```

```typescript
// src/components/planificacion/CalendarioSemanal.tsx — Ver código exacto en frontend-guide.md (líneas 279-327)
// Grid CSS de 7 filas × 7 columnas (1 de horario + 6 días)
```

**Conexión con el paso anterior:** Las materias disponibles se obtienen del progreso del paso 3.5 (filtrando las no completadas). La carrera activa viene del paso 3.4.

### 3.7 Dashboard de Estadísticas (Roadmap #7)

**Abrir y aplicar:**

- **`docs/frontend/dashboard-page.md`** — `DashboardPage` con selector multi-carrera, `PromedioCard`, `TiempoRestanteCard`, `CreditosCard`, `ProgresoBar`, `MateriasPorEstadoChart` (donut), `EvolucionPromedioChart` (línea), hook `useDashboard` con queries paralelas de estadísticas.

**Conexión con el paso anterior:** El Dashboard consume datos del endpoint de estadísticas (respaldado por el módulo de progreso del paso 3.5). Al cambiar de carrera en el selector, React Query refetch automáticamente.

---

## Paso 4: Pruebas Locales y Verificación

### 4.1 Ejecutar el servidor de desarrollo

```bash
cd frontend
npm run dev
```

Abrir en el navegador: `http://localhost:5173`

Asegurarse de que el backend esté corriendo en `http://localhost:3000` para que los endpoints respondan.

### 4.2 Checklist de flujos de usuario

#### Flujo de autenticación

- [ ] Acceder a `http://localhost:5173/dashboard` sin estar logueado → redirige a `/login`
- [ ] Hacer clic en "Registrate" → navega a `/registro`
- [ ] Registrarse con nombre, email, contraseña que cumple requisitos → redirige a `/dashboard`
- [ ] Verificar que la barra de fortaleza de contraseña se actualiza en tiempo real al escribir
- [ ] Intentar registrarse con email ya existente → ver mensaje de error rojo
- [ ] Hacer logout → redirige a `/login`, token eliminado
- [ ] Tratar de navegar a `/dashboard` tras logout → redirige a `/login`

#### Flujo de carreras y plan de estudios

- [ ] Dashboard sin carreras → ver empty state con botón "Ver carreras"
- [ ] Ir a `/carreras` → ver lista de carreras disponibles
- [ ] Inscribirse a una carrera → verla en la lista
- [ ] Click en una carrera → ver plan de estudios con acordeones Año → Cuatrimestre
- [ ] Click en una materia → modal con info y correlativas

#### Flujo de progreso académico

- [ ] Ir a `/progreso` → ver grilla con todas las materias
- [ ] Cambiar estado de una materia → aparece botón "Guardar"
- [ ] Marcar "Completada" → se habilitan campos de nota y tipo de aprobación
- [ ] Guardar con nota 4-10 y tipo seleccionado → ver badge verde actualizado
- [ ] Intentar marcar "Completada" sin nota → modal de confirmación bloquea hasta completar
- [ ] Filtrar por estado "Pendientes" → solo se ven las pendientes
- [ ] Usar búsqueda por nombre con debounce → filtrado correcto
- [ ] Si hay correlativas pendientes y se intenta avanzar → error del backend mostrado como toast

#### Flujo del planificador de horarios

- [ ] Ir a `/planificacion` → ver calendario vacío
- [ ] Crear nueva planificación (año + instancia + nombre opcional)
- [ ] Arrastrar materia desde lista lateral a una celda del calendario → chip aparece en la celda, materia desaparece de disponibles
- [ ] Arrastrar materia de una celda a otra → se mueve
- [ ] Click en "X" del chip → materia vuelve a disponibles
- [ ] Guardar planificación → ver confirmación de éxito
- [ ] Recargar página → cargar la planificación guardada

#### Flujo del dashboard

- [ ] Una vez con progreso registrado, ir a `/dashboard`
- [ ] Ver tarjetas con promedio, cuatrimestres restantes, créditos, porcentaje
- [ ] Ver gráfico de donut con distribución de estados
- [ ] Ver gráfico de línea con evolución del promedio
- [ ] Si hay múltiples carreras, cambiar entre ellas con el selector → datos se actualizan

#### Estados de carga y error

- [ ] Mientras cargan datos → ver skeletons/spinners
- [ ] Si el backend está caído → ver Alert de error con botón "Reintentar"
- [ ] Si el token expira → ver redirección automática a `/login`
- [ ] Datos vacíos → ver EmptyState con mensaje descriptivo
- [ ] Página no encontrada (ruta inválida) → redirige a `/dashboard`

### 4.3 Verificar integración JWT completa

1. Hardcodear un token expirado en localStorage → recargar → debe redirigir a `/login`
2. Abrir en pestaña privada → acceder a ruta protegida → redirige a `/login`
3. Login exitoso → en localStorage aparece `auth-storage` con token y usuario
4. En cada request al backend, ver en DevTools Network que el header `Authorization: Bearer <token>` está presente
5. Si el backend responde 401 → el interceptor cierra sesión y redirige
