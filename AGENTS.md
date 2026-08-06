# AGENTS.md

## Estado del proyecto

Backend implementado en `backend/`. Frontend implementado en `frontend/` (React 19 + Vite 8, `npm run lint` con oxlint sin warnings y `npm run build` OK). Ver `docs/backend-guide.md` y `docs/frontend-implementation-step-by-step.md` para el estado actual.

## Stack definido en la documentación

- **Backend:** NestJS, TypeScript, TypeORM, MariaDB 11.5, Express, Swagger, class-validator
- **Frontend (real):** React 19, Vite 8, Tailwind CSS 3, TypeScript 6, React Router 7, Axios, React Query 5, zustand 5, React Hook Form 7 + Zod 4, recharts 3, oxlint (no ESLint).
- **Módulo admin implementado:** página `/admin` (tabs Carreras/Materias/Plan/Correlativas) para gestión del catálogo académico. Backend sin `RolesGuard` aún (cualquier usuario autenticado puede usarla). Ver `docs/backend/admin-carreras-materias-module.md`.
- **Sistema de créditos por actividades (HECHO):** modelo de créditos por actividades (seminarios, proyectos, idiomas, etc.) con requisitos por carrera. Backend en `backend/src/modules/creditos/` (8 tablas: `sistema_creditos`, `categoria_credito`, `actividad_credito`, `carrera_categoria_credito`, `carrera_actividad_credito`, `carrera_actividad_requisito_materia`, `progreso_actividad`), endpoint `PUT /carreras/:id/creditos/actividades/:carreraActividadCreditoId/requisitos`, `GET /estadisticas/creditos-progreso`. Frontend: editor en pestaña Créditos de `/admin/carreras/:id` (tab persistido en localStorage), página `/creditos` (resumen "Créditos obtenidos" + barra full-width con %, actividades con chip `+X créditos` y nombre sin tachado al completar), `SistemaCreditosCard` en detalle de carrera, `CreditosProgresoChart` en dashboard. **Catálogo global gestionable en `/admin` → tab Créditos** (tabs Categorías/Actividades, edición y borrado lógico con `activo`; lo inactivo no aparece para usuarios y nunca se borra el progreso). Ver `docs/implementaciones/sistema-de-creditos.md` y `docs/implementaciones/creditos-admin-tabs-borrado-logico.md`.
- **Dashboard refactorizado (HECHO):** estilo Suizo + gráficos recharts (pastel de estados, distribución de notas, progreso por año, progreso de créditos), tarjetas `StatCard` (`MateriasAprobadasCard`/`PromedioCard`/`CreditosCard`/`MateriasDisponiblesCard`/`ProgresoBarCard`), hook `useEstadisticas`, `ChartTooltip`, endpoints `notas-distribucion` y `progreso-por-anio`. Ver `docs/implementaciones/refactor-dashboard-page.md`.
- **Package manager:** npm (ambos)
- **Node:** 20 LTS

## Dónde arrancar

1. Leer `docs/database-design.md` — modelo de datos completo con 11 tablas, relaciones M:N, correlativas auto-referenciadas, bloques horarios fijos.
2. Leer `docs/backend-guide.md` — estructura modular de NestJS, configuración de TypeORM, validación, swagger.
3. Leer `docs/frontend-guide.md` — estructura de páginas, store (zustand + React Query), rutas, componentes reutilizables.
4. Los archivos en `docs/backend/`, `docs/frontend/` y `docs/security/` tienen especificaciones detalladas por módulo/página.

## Reglas de negocio clave (documentadas en `docs/`)

- **Nota:** INT entre 4 y 10, obligatoria solo cuando estado = Completada.
- **Tipo aprobación:** ENUM('Final', 'Promocion'), obligatorio con Completada.
- **Correlativas:** validar antes de permitir "En Proceso" o "Completada".
- **Bloques horarios:** 7 bloques fijos de 2h (08-10, 10-12, ..., 20-22). Lunes a Sábado.
- **Periodos de planificación:** Verano, 1er Cuatrimestre, 2do Cuatrimestre. Múltiples variantes por período (campo `nombre`).

## Convenciones del modelo de datos

- PK: `{tabla}_id` INT AUTO_INCREMENT.
- FK: nombre explícito, NOT NULL, con índice.
- Tablas pivote para M:N: `usuario_carrera`, `carrera_materia`, `correlativa`.
- `estado_materia` es tabla catálogo (no ENUM) con valores: Pendiente (1), En Proceso (2), Completada (3).

## Documentación referenciada

| Archivo | Contenido |
|---|---|
| `docs/database-design.md` | ERD Mermaid, 11 tablas, consultas SQL de estadísticas |
| `docs/backend-guide.md` | Estructura NestJS por módulos, TypeORM relations, validation pipe, swagger setup |
| `docs/backend-implementation-step-by-step.md` | Backend: guía de implementación paso a paso |
| `docs/frontend-implementation-step-by-step.md` | Frontend: guía de implementación paso a paso |
| `docs/api-endpoints.md` | Referencia de endpoints REST del backend para el frontend |
| `docs/frontend-guide.md` | Estructura React, rutas, store, hooks, componentes, formularios |
| `docs/backend/auth-module.md` | Endpoints, DTOs, JwtAuthGuard, JwtStrategy |
| `docs/backend/users-module.md` | Perfil, inscripción a carreras |
| `docs/backend/carreras-materias-module.md` | Plan de estudios, correlativas auto-referenciadas |
| `docs/backend/admin-carreras-materias-module.md` | Módulo admin backend: carreras, materias, plan, correlativas |
| `docs/backend/progreso-module.md` | Estados, notas, validación de correlativas |
| `docs/backend/planificacion-horarios-module.md` | Periodos, bloques, conflictos horarios |
| `docs/backend/estadisticas-module.md` | Promedio, cuatrimestres restantes, queries SQL |
| `docs/backend/trayectoria-module.md` | Trayectoria entity, endpoints, fork validation, árbol de bifurcaciones |
| `docs/frontend/login-registro-page.md` | Formularios, validación Zod, barra de fortaleza |
| `docs/frontend/dashboard-page.md` | Tarjetas, gráficos, selector multi-carrera |
| `docs/frontend/plan-estudios-page.md` | Árbol Año→Cuatrimestre, modal correlativas |
| `docs/frontend/progreso-academico-page.md` | Grilla inline, modal nota obligatoria |
| `docs/frontend/planificador-horarios-page.md` | Calendario drag & drop, store zustand |
| `docs/frontend/admin-page.md` | Módulo admin: carreras, materias, plan, correlativas, chips neon-cyan |
| `docs/frontend/trayectorias-page.md` | Páginas TrayectoriasPage y TrayectoriaPage, ArbolTrayectoria, chips, navegación |
| `docs/security/jwt-auth-specification.md` | Payload JWT, Passport strategy, Axios interceptor, PrivateRoute |
| `docs/implementaciones/refactor-dashboard-page.md` | Dashboard final: StatCards, gráficos recharts, useEstadisticas, ChartTooltip, fixes UX, animaciones |
| `docs/implementaciones/refactor-css-estilo-suizo.md` | Design tokens Suizo, migración de componentes, secciones 7.10/7.11 (Charts/StatCards) |
| `docs/implementaciones/sistema-de-creditos.md` | Créditos por actividades: 8 tablas, requisitos por carrera, CreditosEditor, página `/creditos`, CreditosProgresoChart |
| `docs/implementaciones/refactor-admin-module.md` | Refactor módulo admin: tabs, persistencia en localStorage, chips neon-cyan |
| `docs/implementaciones/editar-plan-estudios.md` | Edición de posición de materias en el plan de estudios |
| `docs/implementaciones/planificacionesSucesivas.md` | Planificaciones sucesivas, fork de trayectorias |
| `docs/implementaciones/progreso-compartido-entre-carreras.md` | Progreso compartido entre carreras |
| `docs/implementaciones/arbol-horizontal-trayectoria.md` | Árbol de trayectoria horizontal con cards, drag-to-scroll |
| `docs/implementaciones/creditos-admin-tabs-borrado-logico.md` | Catálogo global de créditos en `/admin` (tabs Categorías/Actividades), edición y borrado lógico con `activo`, el progreso nunca se borra |
