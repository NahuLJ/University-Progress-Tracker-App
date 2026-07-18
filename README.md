# University Progress Tracker App

Sistema de seguimiento de carreras universitarias: gestión de planes de estudio, progreso académico, estadísticas y planificación horaria.

## Estado

Backend implementado en `backend/`. Documentación en [`docs/`](docs/).

## Stack

| Capa | Tecnologías |
|---|---|
| Backend | NestJS, TypeScript, TypeORM, MariaDB 11.5, Express, Swagger |
| Frontend | React 18, Vite 5, Tailwind CSS 3, TypeScript, React Router 6, Axios, React Query 5, zustand 4, React Hook Form + Zod |

## Documentación

| Archivo | Contenido |
|---|---|
| [`docs/database-design.md`](docs/database-design.md) | Modelo de datos, ERD, 11 tablas, consultas SQL |
| [`docs/backend-guide.md`](docs/backend-guide.md) | Arquitectura NestJS, módulos, TypeORM, validación, Swagger |
| [`docs/frontend-guide.md`](docs/frontend-guide.md) | Estructura React, rutas, store, hooks, componentes |
| [`docs/backend/`](docs/backend/) | Especificaciones detalladas por módulo (auth, users, carreras, progreso, planificación, estadísticas) |
| [`docs/frontend/`](docs/frontend/) | Especificaciones detalladas por página (login, dashboard, plan de estudios, progreso, planificador) |
| [`docs/security/`](docs/security/) | Especificación JWT unificada backend + frontend |
| [`AGENTS.md`](AGENTS.md) | Guía de contexto para asistentes de IA |

## Requisitos previos

- Node.js 20 LTS
- npm 10+
- MariaDB 11.5+ (MySQL-compatible)

## Inicio rápido

```bash
# Backend
cd Backend
npm install
npm run start:dev

# Frontend
cd Frontend
npm install
npm run dev
```
