# AGENTS.md

## Estado del proyecto

Proyecto en fase de diseño. Las carpetas `Backend/` y `Frontend/` están vacías. No hay `package.json`, lockfiles, ni config de herramientas. Todo el plan arquitectónico está en `docs/`.

## Stack definido en la documentación

- **Backend:** NestJS, TypeScript, TypeORM, MySQL, Express, Swagger, class-validator
- **Frontend:** React 18, Vite 5, Tailwind CSS 3, TypeScript, React Router DOM 6, Axios, React Query 5, zustand 4, React Hook Form + Zod
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
| `docs/frontend-guide.md` | Estructura React, rutas, store, hooks, componentes, formularios |
| `docs/backend/auth-module.md` | Endpoints, DTOs, JwtAuthGuard, JwtStrategy |
| `docs/backend/users-module.md` | Perfil, inscripción a carreras |
| `docs/backend/carreras-materias-module.md` | Plan de estudios, correlativas auto-referenciadas |
| `docs/backend/progreso-module.md` | Estados, notas, validación de correlativas |
| `docs/backend/planificacion-horarios-module.md` | Periodos, bloques, conflictos horarios |
| `docs/backend/estadisticas-module.md` | Promedio, cuatrimestres restantes, queries SQL |
| `docs/frontend/login-registro-page.md` | Formularios, validación Zod, barra de fortaleza |
| `docs/frontend/dashboard-page.md` | Tarjetas, gráficos, selector multi-carrera |
| `docs/frontend/plan-estudios-page.md` | Árbol Año→Cuatrimestre, modal correlativas |
| `docs/frontend/progreso-academico-page.md` | Grilla inline, modal nota obligatoria |
| `docs/frontend/planificador-horarios-page.md` | Calendario drag & drop, store zustand |
| `docs/security/jwt-auth-specification.md` | Payload JWT, Passport strategy, Axios interceptor, PrivateRoute |
