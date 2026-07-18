# Frontend - University Progress Tracker

## Overview
This is the React frontend for the University Progress Tracker application. It provides a comprehensive interface for students to track their academic progress, plan their schedules, and manage their university careers.

## Features

### Core Features
- **Authentication & User Management** - Login, registration, and secure session management
- **Career Management** - Browse, search, and enroll in university careers
- **Academic Progress Tracking** - Inline editing of course states, grades, and approval types
- **Study Planning** - Visual calendar for scheduling classes across semesters
- **Academic Statistics** - Real-time analytics and visualizations of progress
- **Course Management** - View detailed course information and prerequisites

### User Interface
- **Modern, responsive design** - Works seamlessly on desktop and mobile
- **Clean, intuitive UI** - Following Google Material Design principles
- **Real-time updates** - Live data synchronization
- **Accessible** - Full keyboard navigation and screen reader support

## Technology Stack

### Frontend Stack
- **React 19** - Component-based architecture with hooks
- **TypeScript** - Full type safety throughout the codebase (`tsc -b` en build)
- **Vite 8** - Fast development server and bundling (`npm run dev` on port 5173)
- **Tailwind CSS 3** - Utility-first CSS framework (config in `tailwind.config.ts`)
- **React Router DOM 7** - Client-side routing (`createBrowserRouter`)
- **Zustand 5** - Lightweight global state (auth + planificación)
- **React Hook Form 7 + Zod 4** - Form handling and validation
- **Axios** - HTTP client for API communication
- **React Query 5** - Server state management and caching
- **oxlint** - Linting (`npm run lint`)
- **clsx / tailwind-merge** - CSS class utility functions

### Backend Integration
- **REST API** - All functionality exposed through a REST API
- **JWT Authentication** - Secure token-based authentication
- **CORS Enabled** - Cross-origin resource sharing configured
- **API Documentation** - Complete OpenAPI-like documentation

## Project Structure

```
frontend/
├── .env                    # Environment variables
├── index.html             # Public HTML template
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── tsconfig.app.json      # App-specific TypeScript config
├── vite.config.ts        # Vite build configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── src/
    ├── main.tsx          # Application entry point
    ├── App.tsx           # Root component and router
    ├── routes/           # Application routes
    │   ├── index.tsx     # Router configuration
    │   └── PrivateRoute.tsx # Authentication guard
    ├── layouts/          # Page layouts
    │   ├── AuthLayout.tsx     # Login/registration layout
    │   └── MainLayout.tsx     # Main application layout
    ├── pages/            # Main application pages
    │   ├── LoginPage.tsx          # Login page
    │   ├── RegisterPage.tsx       # Registration page
    │   ├── DashboardPage.tsx      # Statistics dashboard
    │   ├── CarrerasPage.tsx       # Careers listing page
    │   ├── CarreraDetailPage.tsx  # Career details and study plan
    │   ├── ProgresoPage.tsx       # Academic progress tracking
    │   └── PlanificacionPage.tsx  # Class scheduling calendar
    ├── components/       # Reusable UI components
    │   ├── ui/          # Atomic UI components
    │   │   ├── Button.tsx           # Interactive buttons
    │   │   ├── Card.tsx            # Content containers
    │   │   ├── Modal.tsx           # Dialog windows
    │   │   ├── Input.tsx           # Form inputs
    │   │   ├── Select.tsx          # Dropdown selectors
    │   │   ├── Badge.tsx           # Status indicators
    │   │   ├── Alert.tsx           # Notification messages
    │   │   ├── Skeleton.tsx        # Loading placeholders
    │   │   └── ProgressBar.tsx      # Progress indicators
    │   ├── auth/         # Authentication components
    │   │   ├── LoginForm.tsx        # Login form
    │   │   ├── RegisterForm.tsx     # Registration form
    │   │   └── AuthCard.tsx        # Authentication layout
    │   ├── dashboard/    # Dashboard components
    │   ├── carrera/      # Career-related components
    │   ├── progreso/     # Progress tracking components
    │   └── planificacion/ # Scheduling components
    ├── hooks/           # Custom React hooks
    │   ├── useAuth.ts           # Authentication hook
    │   ├── useCarreras.ts       # Career management hook
    │   ├── useProgreso.ts       # Progress tracking hook
    │   ├── useDashboard.ts      # Dashboard data hook
    │   └── usePlanificacion.ts  # Scheduling hook
    ├── services/        # API service layer
    │   ├── api.ts              # Axios instance
    │   ├── auth.service.ts      # Authentication services
    │   ├── carreras.service.ts  # Career services
    │   ├── materias.service.ts  # Course services
    │   ├── progreso.service.ts  # Progress services
    │   ├── estadisticas.service.ts # Statistics services
    │   └── planificacion.service.ts # Scheduling services
    ├── store/           # Global state management
    │   ├── auth.store.ts        # User authentication store
    │   └── planificacion.store.ts # Scheduling store
    ├── types/           # TypeScript interfaces
    │   ├── api.types.ts         # API response types
    │   ├── auth.types.ts        # Authentication types
    │   ├── carrera.types.ts     # Career types
    │   ├── materia.types.ts     # Course types
    │   ├── progreso.types.ts    # Progress types
    │   ├── estadisticas.types.ts # Statistics types
    │   └── planificacion.types.ts # Scheduling types
    └── utils/            # Utility functions and constants
        ├── constants.ts        # Application constants
        ├── formato.ts          # String formatting utilities
        ├── cn.ts              # CSS class helpers
        └── fortaleza.ts        # Password strength calculation
```

## Getting Started

### Prerequisites
- Node.js 20 LTS or higher
- Python 3.8+ (for the backend)

### Installation

1. **Backend Setup**
   ```bash
   cd backend
   npm install (or npm ci)
   npm run db:init    # Initialize database
   npm run start      # Start the backend server (port 3000)
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install (or npm ci)
   ```

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   npm run start
   ```

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:5173`

### Configuration

#### Environment Variables

Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3000/api
```

Backend (`backend/.env`):
```env
DATABASE_URL=sqlite:./data/database.sqlite
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

#### API Documentation

For complete API reference, see [docs/api-endpoints.md](../docs/api-endpoints.md)

## Development

### Scripts

#### Frontend Scripts
- `npm run dev` - Start development server (port 5173)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint linting
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run tests

#### Backend Scripts
- `npm run start` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run db:init` - Initialize database with sample data

### Code Quality

#### Linting & Formatting
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript strict mode** - Full type safety

#### Development Conventions

1. **Component Structure**
   - Functional components with hooks
   - PascalCase for component names
   - camelCase for functions and variables
   - TypeScript interfaces for all props

2. **State Management**
   - `zustand` for lightweight global state
   - `React Query` for server state
   - Minimizing React state to component level

3. **Routing**
   - Lazy loading of route components
   - Protected routes for authenticated content
   - Suspense boundaries for loading states

4. **API Calls**
   - All API calls through service layer
   - Automatic token injection via axios interceptor
   - Comprehensive error handling

### Testing

#### Testing Strategy
- **Unit Tests** - Component and utility function tests
- **Integration Tests** - API service tests
- **E2E Tests** - User workflow testing

#### Test Commands
- `npm test` - Run all tests
- `npm run test:frontend` - Run frontend tests
- `npm run test:backend` - Run backend tests

### Deployment

#### Production Build
1. **Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Backend**
   ```bash
   cd backend
   npm run build
   ```

3. **Docker**
   - Both frontend and backend are Docker-ready
   - Environment variables configured for production

## Components Library

### Atomic UI Components

| Component | Description |
|-----------|-------------|
| `Button` | Interactive button with variants and loading states |
| `Card` | Content container with header and optional title/subtitle |
| `Modal` | Dialog window with close functionality |
| `Input` | Form input with label, error, and helper text |
| `Select` | Dropdown selector with accessibility features |
| `Badge` | Status indicator with variants |
| `Alert` | Notification message with close button |
| `Skeleton` | Loading placeholder animations |
| `ProgressBar` | Visual progress indicator |

### Domain-Specific Components

#### Authentication
- `LoginForm` - Login form with validation
- `RegisterForm` - Registration form with password strength
- `AuthCard` - Authentication layout wrapper

#### Dashboard
- `PromedioCard` - Average grade display
- `TiempoRestanteCard` - Remaining time estimation
- `CreditosCard` - Credits obtained vs. total
- `MateriasPorEstadoChart` - Donut chart for distribution
- `EvolucionPromedioChart` - Line chart for historical data

#### Career Management
- `CarrerasPage` - List of enrolled careers
- `CarreraDetailPage` - Study plan with tree/table view
- `MateriaDetailModal` - Course details and prerequisites
- `InscribirCarreraModal` - Career enrollment form

#### Progress Tracking
- `ProgresoPage` - Main progress tracking interface
- `ProgresoGrid` - Editable grid of course states
- `MateriaProgresoRow` - Individual course row with inline editing
- `CompletarMateriaModal` - Grade and approval type entry

#### Scheduling
- `PlanificacionPage` - Main scheduling interface
- `CalendarioSemanal` - 7x6 grid with drag & drop
- `MateriaPlanificadaChip` - Draggable course chip
- `MateriaDisponibleList` - List of available courses for dragging

## Performance Optimization

### Lazy Loading
- Route components loaded on-demand
- Route-level code splitting
- Bundle size optimized for faster initial load

### Caching
- React Query handles server-side caching
- Local storage for critical data (authentication token)
- Aggressive cache invalidation for data mutations

### Image Optimization
- Modern image formats (WebP)
- Responsive image sizes
- Lazy loading for off-screen images

## Accessibility

### Standards Compliance
- WCAG 2.1 Level AA compliant
- ARIA attributes for screen readers
- Keyboard navigation support
- High contrast mode support

### Component Accessibility
- All interactive elements keyboard accessible
- Proper focus management
- Descriptive labels and announcements
- Reduced motion support

## Roadmap

### Phase 1 (Current)
- ✅ Authentication system (login/registro con RHF + Zod)
- ✅ Routing and navigation (React Router 7, lazy)
- ✅ Basic UI components (ui/, common/)
- ✅ API integration (Axios + interceptor JWT)

### Phase 2
- ✅ Plan de Estudios (Carreras + Materias)
- ✅ Progreso Académico (inline editing)
- 🟡 Dashboard statistics (componentes listos, page usa placeholders)

### Phase 3
- ✅ Planificador de Horarios (calendar drag & drop)
- 🟡 Advanced statistics and charts (componentes listos, pendiente cablear al page)
- ⬜ Mobile responsive improvements

## Known Limitations (estado actual del código)

- `DashboardPage` renderiza **valores de ejemplo hardcodeados** y aún no usa `StatCards`/`Charts`/`CarrerasResumenList`.
- `ProgresoPage` y `PlanificacionPage` usan `usuarioCarreraId = 1` fijo (TODO: tomar del auth store).
- `InscribirCarreraModal` tiene carreras disponibles **mockeadas** y su submit solo hace `console.log`.
- `CarrerasPage`: botón "Desinscribirse" es un `confirm()` con TODO (no llama a `desinscribirCarrera`).
- `CompletarMateriaModal` y `Filtros` están implementados pero aún no se usan desde `ProgresoPage`.
- No existe un selector de carrera multi-carrera funcional en Progreso/Dashboard más allá del estado local en `useDashboard`.

Ver `../docs/frontend-guide.md` y las páginas en `../docs/frontend/` para el detalle actualizado.

## Support and Documentation

### Resources
- [📚 Frontend Guide](../docs/frontend-guide.md) - Complete technical specification
- [🔐 JWT Auth Specification](../docs/security/jwt-auth-specification.md) - Security patterns
- [📊 Implementation Step-by-Step](../docs/frontend-implementation-step-by-step.md) - Detailed implementation guide

### Support
- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - Complete inline documentation
- **Code Examples** - Implementation patterns and best practices

## License

This frontend is part of the University Progress Tracker project. See the repository root for licensing information.

---

*Built with ❤️ using modern web technologies for a seamless academic tracking experience*