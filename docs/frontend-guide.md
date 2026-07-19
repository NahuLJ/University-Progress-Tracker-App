# Frontend Guide — Sistema de Seguimiento de Carreras Universitarias

> Documentación actualizada para reflejar el código implementado en `frontend/`.
> Las versiones y la estructura de archivos coinciden con lo que existe hoy en el repositorio.

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| Node.js | 20 LTS | Entorno de ejecución |
| npm | 10+ | Gestor de paquetes |
| React | 19.x | Librería de interfaz de usuario |
| Vite | 8.x | Bundler y dev server (`npm run dev` en el puerto 5173) |
| TypeScript | 6.x (con `tsc -b`) | Tipado estático |
| Tailwind CSS | 3.x | Framework de estilos utilitario (config en `tailwind.config.ts`) |
| React Router DOM | 7.x | Enrutamiento SPA (`createBrowserRouter`) |
| Axios | 1.x | Cliente HTTP para consumir la API |
| React Hook Form | 7.x | Manejo de formularios |
| Zod | 4.x | Esquemas de validación (wrap con `@hookform/resolvers`) |
| @tanstack/react-query | 5.x | Caching y estado del servidor |
| zustand | 5.x | Estado global liviano |

**Linting:** se usa `oxlint` (`npm run lint`), no ESLint. Build: `npm run build` (`tsc -b && vite build`).
No hay script `typecheck` dedicado; la verificación de tipos ocurre dentro de `build`.

---

## Arquitectura y Estructura de Archivos

### Principios Arquitectónicos

- **Separación de capas**: páginas (`pages/`) → hooks (`hooks/`) + services (`services/`) → API.
- **Estado global mínimo**: zustand se usa solo para sesión (`auth.store`) y para la planificación en edición (`planificacion.store`). Los datos del servidor se manejan con React Query (caching, refetch, loading states).
- **Componentes puros y reutilizables**: la carpeta `components/` contiene piezas atómicas (`ui/`) y por dominio (`auth/`, `carrera/`, `progreso/`, `planificacion/`, `dashboard/`, `common/`).
- **Tipado compartido**: los tipos de entidades y DTOs se definen en `types/` y se consumen en services y componentes.
- **Rutas lazy-loaded**: cada página se carga con `React.lazy()` declaradas en `routes/lazy-pages.tsx` y consumidas por `routes/index.tsx` (separadas para respetar la regla `react/only-export-components` de oxlint).
- **Contexto de auth**: `context/AuthProvider` (`AuthContext.tsx`) envuelve la app; el context vive en `context/auth-context.ts` y el hook en `context/useAuth.ts` (archivos separados por la regla `only-export-components`).

### Estructura de Archivos (real)

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── .env                          # VITE_API_URL=http://localhost:3000/api
│
└── src/
    ├── main.tsx                  # Punto de entrada, monta <App />
    ├── App.tsx                   # QueryClientProvider + AuthProvider + RouterProvider
    ├── index.css                 # @tailwind + componentes @layer (.btn-primary, .card, .badge-*, ...)
    │
    ├── routes/
    │   ├── index.tsx             # createBrowserRouter (importa las páginas lazy)
    │   ├── lazy-pages.tsx        # React.lazy() de cada página + SuspenseWrapper
    │   └── PrivateRoute.tsx      # redirige a /login si no hay token
    │
    ├── layouts/
    │   ├── AuthLayout.tsx        # layout centrado para login/registro
    │   └── MainLayout.tsx        # layout con sidebar/header y <Outlet />
    │
    ├── context/
    │   ├── AuthContext.tsx       # AuthProvider (efecto de init de sesión)
    │   ├── auth-context.ts       # createContext + AuthContextType
    │   └── useAuth.ts            # hook useAuth()
    │
    ├── pages/                    # una página por ruta (delegación delgada a components/)
    │   ├── LoginPage.tsx
    │   ├── RegisterPage.tsx
    │   ├── DashboardPage.tsx
    │   ├── CarrerasPage.tsx      # delega a components/carrera/CarrerasPage
    │   ├── CarreraDetailPage.tsx # plan de estudios de una carrera
    │   ├── ProgresoPage.tsx
    │   ├── PlanificacionPage.tsx
    │   └── AdminPage.tsx          # tabs Carreras | Materias | Plan | Correlativas (uso admin)
    │
    ├── components/
    │   ├── ui/                   # atómicos (sin dependencia de rutas)
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Select.tsx
    │   │   ├── Input.tsx
    │   │   ├── Alert.tsx
    │   │   ├── ProgressBar.tsx
    │   │   ├── Skeleton.tsx
    │   │   ├── Accordion.tsx
    │   │   ├── PasswordInput.tsx # input con toggle de visibilidad (definido, ver nota abajo)
    │   │   └── Snackbar.tsx      # notificaciones flotantes globales (success/error/info)
    │   │
    │   ├── auth/
    │   │   ├── LoginForm.tsx
    │   │   └── RegisterForm.tsx
    │   │
    │   ├── dashboard/
    │   │   ├── StatCards.tsx       # PromedioCard, TiempoRestanteCard, CreditosCard, ProgresoBarCard
    │   │   ├── Charts.tsx          # MateriasPorEstadoChart, EvolucionPromedioChart, EstadisticasSkeleton
    │   │   └── CarrerasResumenList.tsx
    │   │
    │   ├── carrera/
    │   │   ├── CarrerasPage.tsx      # lista inscripciones + disponibles; solo "Ver plan de estudios"
    │   │   ├── CarreraCard.tsx       # card con badge Inscripto/Desinscripto + botón "Ver plan de estudios"
    │   │   ├── PlanEstudiosTree.tsx  # árbol Año → Cuatrimestre → Materia (usa Accordion)
    │   │   ├── MateriaDetailModal.tsx
    │   │   ├── CorrelativasList.tsx
    │   │   ├── InscribirCarreraModal.tsx
    │   │   └── DesinscribirCarreraModal.tsx # confirmación simple (sin escribir texto)
    │   │
    │   ├── progreso/
    │   │   ├── ProgresoGrid.tsx
    │   │   ├── MateriaProgresoRow.tsx
    │   │   ├── Filtros.tsx           # FiltroEstado + FiltroBusqueda (con debounce)
    │   │   ├── CompletarMateriaModal.tsx
    │   │   └── index.tsx             # barrel export
    │   │
    │   ├── planificacion/
    │   │   ├── CalendarioSemanal.tsx     # grilla 7 bloques × 6 días
    │   │   ├── BloqueHorarioCelda.tsx    # celda drop zone (HTML5 drag & drop)
    │   │   ├── MateriaPlanificadaChip.tsx
    │   │   ├── MateriaDisponibleList.tsx
    │   │   ├── NuevoPeriodoModal.tsx
    │   │   ├── PlanificacionTabs.tsx
    │   │   ├── PeriodoSelector.tsx      # (definido, no usado en PlanificacionPage)
    │   │   └── Extras.tsx               # LeyendaHorarios, VistaSemanalHeader, VistaHorariosHeader, MateriasDesbloqueablesList
    │   │
    │   └── common/
    │       ├── LoadingSpinner.tsx
    │       └── EmptyState.tsx
    │
    ├── hooks/
    │   ├── useAuthForm.ts        # useLoginForm + useRegisterForm (RHF + Zod + mutation)
    │   ├── useCarreras.ts        # useCarreras() + useInscribir/Desinscribir/Reactivar/EliminarCarrera() + useCarreraActiva()
    │   ├── usePlanEstudios.ts    # useQuery del plan de una carrera
    │   ├── useProgreso.ts        # useQuery + useMutation + filtros (estado/búsqueda)
    │   ├── useDashboard.ts       # carreras + resumen/distribucion/evolucion
    │   ├── usePlanificacion.ts   # períodos, materias del período, desbloqueables, guardar
    │   ├── useAdminCarreras.ts   # crearCarrera + agregarMateriaAlPlan (mutations)
    │   └── useAdminMaterias.ts   # listar/crear materias, asignar/quitar correlativas
    │
    ├── services/
    │   ├── api.ts                # instancia Axios + interceptor JWT
    │   ├── auth.service.ts       # login, register, obtenerPerfil
    │   ├── carreras.service.ts   # carreras del usuario, activas, disponibles, plan, inscribir,
    │   │                        #   desinscribir, reactivar, eliminar definitivamente
    │   │                        #   + admin: crearCarrera, agregarMateriaAlPlan
    │   │                        #   + materiasAdminService: listar, obtenerMateria, crear,
    │   │                        #     asignarCorrelativa, eliminarCorrelativa
    │   ├── materias.service.ts   # (eliminado) → reemplazado por materiasAdminService en carreras.service.ts
    │   ├── progreso.service.ts   # obtener, actualizar, inicializar progreso
    │   ├── estadisticas.service.ts # resumen, distribución, evolución, carreras-resumen
    │   └── planificacion.service.ts # períodos, bloques, materias, desbloqueables
    │
    ├── store/
    │   ├── auth.store.ts         # zustand + persist: token, usuario, setAuth, logout, isAuthenticated
    │   ├── sidebar.store.ts      # zustand + persist: sidebar collapsed
    │   ├── carrera.store.ts      # zustand + persist: usuarioCarreraId seleccionado
    │   ├── notification.store.ts # zustand: notificaciones del snackbar (add/remove + auto-dismiss)
    │   └── planificacion.store.ts# zustand + devtools: período activo, celdas, materias, dirty
    │
    ├── types/
    │   ├── api.types.ts
    │   ├── auth.types.ts
    │   ├── carrera.types.ts
    │   ├── materia.types.ts
    │   ├── progreso.types.ts
    │   ├── estadisticas.types.ts
    │   └── planificacion.types.ts
    │
    └── utils/
        ├── cn.ts                # clsx + tailwind-merge
        ├── constants.ts         # BLOQUES_HORARIOS, DIAS_SEMANA, ESTADOS
        ├── formato.ts
        ├── fortaleza.ts         # calcularFortaleza (definido, ver nota)
        └── debounce.ts          # useDebounce hook
```

---

## Detalles Críticos para la Implementación

### 1. Manejo del Estado Global

#### zustand — Sesión de Usuario (`store/auth.store.ts`)

`auth.store` usa el middleware `persist` (clave `auth-storage`) guardando solo `token` y `usuario`.
Incluye un helper `isAuthenticated()` que decodifica el payload JWT y comprueba `exp`.

```typescript
interface AuthState {
    token: string | null;
    usuario: { id: number; nombre: string; email: string } | null;
    setAuth: (token: string, usuario: Usuario) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
}
```

`context/AuthContext.tsx` envuelve la app con `AuthProvider`; el hook `useAuth()` (en `context/useAuth.ts`) lee el context definido en `context/auth-context.ts`.

#### zustand — Planificación en Edición (`store/planificacion.store.ts`)

Usa el middleware `devtools`. Mantiene el período activo, un mapa de celdas (`"BLOQUE_ID-DIA" → MateriaEnCelda[]`),
la lista de materias disponibles y el flag `dirty` (cambios sin guardar). Ver detalle en
`docs/frontend/planificador-horarios-page.md`.

#### React Query — Datos del Servidor

Cada dominio tiene su propio hook (`useCarreras`, `useProgreso`, `useDashboard`, `usePlanificacion`, ...).
El `QueryClient` se configura en `App.tsx` con `staleTime: 5 min` y `retry: 1`. Las mutaciones invalidan
las query keys correspondientes (`['progreso', usuarioCarreraId]`, `['estadisticas']`, `['carreras', usuarioId]`, etc.)
y muestran notificaciones vía `useNotificationStore.addNotification()` (success en `onSuccess`, error en `onError`).

### 2. Consumo de la API con Axios

`services/api.ts` crea una instancia Axios con `baseURL = import.meta.env.VITE_API_URL`.
Un interceptor de request inyecta `Authorization: Bearer <token>` desde `auth.store`.
El interceptor de response, ante un `401`, limpia el store y redirige a `/login`.

### 3. Formularios (React Hook Form + Zod)

Se usa RHF + Zod en: `useAuthForm` (login/registro), `MateriaProgresoRow` (estado/nota/tipo),
`InscribirCarreraModal`, `NuevoPeriodoModal`. El schema de progreso valida que al estar
"Completada" existan `nota` (4–10) y `tipoAprobacion` (Final/Promocion).

### 4. Calendario de Bloques Horarios

`CalendarioSemanal` renderiza una grilla CSS `grid-cols-[auto_repeat(6,1fr)]` con 7 bloques
(08-10 … 20-22) × 6 días (Lunes–Sábado). El drag & drop usa la API nativa HTML5
(`draggable` + `dataTransfer.setData('materiaId', ...)`); las celdas son drop zones que llaman
`asignarMateria` del store. Ver detalle en `docs/frontend/planificador-horarios-page.md`.

---

## Rutas de la Aplicación

Definidas en `routes/index.tsx` con `createBrowserRouter` (React Router 7).

| Ruta | Página | Descripción | Acceso |
|---|---|---|---|
| `/login` | `LoginPage` | Email + password. Redirige a `/dashboard` si ya hay sesión. | Público |
| `/registro` | `RegisterPage` | Registro de usuario (RHF + Zod). | Público |
| `/dashboard` | `DashboardPage` | Tarjetas de resumen + gráficos + carreras. | Privado |
| `/carreras` | `CarrerasPage` | Catálogo de carreras; solo "Ver plan de estudios" por card. | Privado |
| `/carreras/:id` | `CarreraDetailPage` | Plan de estudios (toggle árbol/tabla entre cards; botones Expandir/Contraer todo en header de "Plan de estudios" en vista árbol) + acciones inscribir/desinscribir/eliminar. | Privado |
| `/progreso` | `ProgresoPage` | Progreso académico con edición de estado/nota/tipo. | Privado |
| `/planificacion` | `PlanificacionPage` | Planificación cuatrimestral con calendario semanal. | Privado |
| `/admin` | `AdminPage` | Administración: crear carreras, materias y correlativas. | Privado |

> Nota: `/admin` no aplica aún guard de rol (backend aún sin `RolesGuard`); cualquier usuario autenticado puede acceder.

`PrivateRoute` lee `token` del `auth.store` y redirige a `/login` si no existe.

---

## Componentes documentados pero NO implementados (brecha conocida)

Para mantener la documentación honesta respecto al código actual, estos componentes aparecen en
las especificaciones originales pero **no existen** en `src/`:

- `components/auth/AuthCard.tsx` → el layout de auth lo hace directamente `LoginPage`/`RegisterPage`.
- `components/ui/PasswordStrengthBar.tsx` → `RegisterForm` muestra una barra de fortaleza inline simple (no usa `utils/fortaleza.ts`).
- `components/ui/StatCard.tsx` (genérico) → existen `StatCards.tsx` con las 4 tarjetas nombradas.
- `components/ui/Tabs.tsx`, `ScrollArea.tsx`, `ConfirmDialog.tsx` → no existen; se usan `Button`/`Modal`/HTML nativo.
- `components/carrera/CarreraList.tsx`, `PlanEstudiosTable.tsx`, `MateriaBadge.tsx` → no existen; el árbol usa `Accordion` + `Badge`.
- `components/progreso/ProgresoStatsBar.tsx`, `ConfirmarCambioModal.tsx`, `ProgresoBulkActions.tsx` → no existen.
- `components/planificacion/MateriaDisponibleItem.tsx`, `VistaSemanalHeader.tsx`, `VistaHorariosHeader.tsx` → `VistaSemanalHeader`/`VistaHorariosHeader` fueron eliminados (código muerto); el header está embebido en `CalendarioSemanal` y `Extras.tsx` solo tiene `LeyendaHorarios` + `MateriasDesbloqueablesList`.

### Notas de implementación actual

- **Todas las páginas consumen datos reales** vía React Query sobre los servicios Axios (base URL
  `http://localhost:3000/api`). No hay datos mockeados en el frontend.
- **Carrera activa:** `ProgresoPage`, `PlanificacionPage` y `DashboardPage` resuelven la carrera activa
  con `useCarreraActiva()` (del `auth.store`/inscripciones), no un id fijo. `ProgresoPage` además permite
  cambiar de carrera con `CarrerasResumenList` cuando hay más de una.
- **Dashboard** cablea `StatCards`/`Charts`/`CarrerasResumenList` con `useDashboard`.
- **Inscripción/desinscripción:** `CarrerasPage` lista inscripciones (activas e inactivas) y disponibles.
Cada `CarreraCard` solo tiene "Ver plan de estudios". Las acciones de inscribir/desinscribir/reactivar/
eliminar están en `CarreraDetailPage`. `DesinscribirCarreraModal` es confirmación simple (sin escribir texto).
Toda mutación muestra snackbar de éxito/error y resetea la carrera activa del store si corresponde.
- **Progreso:** grilla editable en línea (`MateriaProgresoRow` + RHF/Zod), `CompletarMateriaModal` y
  `Filtros` (debounce) ya integrados en `ProgresoPage`.
- **Admin:** módulo `/admin` (tabs Carreras/Materias/Plan/Correlativas) implementado y verificado E2E.
  El backend aún no aplica `RolesGuard`, por lo que cualquier usuario autenticado puede accederlo.
- **Código muerto eliminado:** `PeriodoSelector`, `VistaSemanalHeader`, `VistaHorariosHeader`,
  `components/ui/PasswordStrengthBar.tsx`, `services/materias.service.ts`. `utils/fortaleza.ts` existe
  pero no se usa (la barra de fortaleza del registro es inline en `RegisterForm`).

---

## Comandos

```bash
cd frontend
npm install
npm run dev        # dev server en http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint       # oxlint
npm run preview    # sirve el build de producción
```

El backend debe estar corriendo en `http://localhost:3000` (ver `backend/README.md`) y `VITE_API_URL`
apuntando a `http://localhost:3000/api`.
