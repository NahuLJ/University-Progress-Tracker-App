# Especificación de Autenticación JWT


> ✅ **Implementado en `backend/`** — Código completo y compilando sin errores.

## Visión General

El sistema utiliza **JSON Web Tokens (JWT)** como mecanismo de autenticación stateless. Un token se emite tras un login o registro exitoso y debe incluirse en todas las peticiones a rutas protegidas mediante el header `Authorization: Bearer <token>`.

---

## Backend — Generación y Validación de Tokens

### 1. Flujo de Generación

```
POST /api/auth/login
       │
       ▼
  ┌─────────────────┐
  │ Validar email    │
  │ y password       │
  └────────┬────────┘
           │ (credenciales válidas)
           ▼
  ┌─────────────────┐
  │ Crear Payload   │
  │   JWT           │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Firmar con       │
  │ JWT_SECRET +     │
  │ expiresIn: 7d    │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────────┐
  │ Retornar al cliente │
  │ { token, usuario }  │
  └─────────────────────┘
```

### 2. Estructura del Payload

```typescript
interface JwtPayload {
    sub: number;          // ID del usuario (usuarioId)
    email: string;        // Email del usuario
    iat?: number;         // Fecha de emisión (timestamp) — agregado automáticamente
    exp?: number;         // Fecha de expiración (timestamp) — agregado automáticamente
}
```

**Ejemplo de token decodificado:**

```json
{
    "sub": 42,
    "email": "juan@example.com",
    "iat": 1778000000,
    "exp": 1778604800
}
```

### 3. Firma y Secreto

| Parámetro | Valor |
|---|---|
| Algoritmo de firma | `HS256` (HMAC con SHA-256) |
| Clave secreta | `JWT_SECRET` (variable de entorno) |
| Longitud mínima recomendada | 256 bits (32 caracteres) |
| Almacenamiento | `.env` del backend, nunca en el código fuente |

```
# .env
JWT_SECRET="a7f3c9d1e5b8a2f4c6d0e8f1a3b5c7d9e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0"
JWT_EXPIRES_IN="7d"
```

### 4. Estrategia de Validación (Passport + NestJS)

```typescript
// auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            // Extraer token del header Authorization: Bearer <token>
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            // No permitir tokens expirados
            ignoreExpiration: false,
            // Clave secreta para verificar la firma
            secretOrKey: process.env.JWT_SECRET,
        });
    }

    async validate(payload: JwtPayload): Promise<{ usuarioId: number; email: string }> {
        // Passport ya verificó:
        //   1. El token tiene una firma válida
        //   2. El token no está expirado
        //   3. El payload tiene los campos esperados
        //
        // Aquí podemos hacer validaciones adicionales (ej. usuario baneado)
        return { usuarioId: payload.sub, email: payload.email };
    }
}
```

### 5. Protección de Rutas

Se usa el guard `JwtAuthGuard` para proteger los endpoints que requieren autenticación.

```typescript
// auth/auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, info: any) {
        if (err || !user) {
            if (info?.name === 'TokenExpiredError') {
                throw new UnauthorizedException('Token expirado. Iniciá sesión nuevamente.');
            }
            throw new UnauthorizedException('Token inválido o ausente.');
        }
        return user;
    }
}
```

**Uso en un controlador:**

```typescript
@Controller('progreso')
@UseGuards(JwtAuthGuard)      // Todas las rutas del controlador requieren autenticación
export class ProgresoController {
    @Get()
    async listar(@Request() req) {
        // req.user contiene { usuarioId, email } (inyectado por Passport)
        return this.progresoService.obtenerPorUsuario(req.user.usuarioId);
    }
}
```

**Decorador @Public para rutas abiertas:**

```typescript
@Controller('auth')
export class AuthController {
    @Post('login')
    @Public()   // Esta ruta no requiere token
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }
}
```

### 6. Registro del Módulo JWT

```typescript
// auth/auth.module.ts
@Module({
    imports: [
        JwtModule.registerAsync({
            useFactory: () => ({
                secret: process.env.JWT_SECRET,
                signOptions: {
                    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
                },
            }),
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
    ],
    providers: [AuthService, JwtStrategy, JwtAuthGuard],
    exports: [AuthService],
})
export class AuthModule {}
```

---

## Frontend — Almacenamiento y Gestión del Token

### 1. Estrategia de Almacenamiento

| Método | Almacenamiento | Persistencia | Seguridad |
|---|---|---|---|
| **zustand + persist (localStorage)** | `localStorage` bajo la clave `auth-storage` | Persiste entre pestañas y sesiones | El token viaja en cada request vía Axios interceptor |
| HttpOnly Cookie | Cookie no accesible desde JS | Según configuración de cookie | No recomendado para SPA con frontend separado del backend |

**Decisión técnica:** Se usa **localStorage** con zustand persist middleware por simplicidad. El token no contiene información sensible y la comunicación es siempre por HTTPS.

```typescript
// store/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    token: string | null;
    usuario: { id: number; nombre: string; email: string } | null;
    setAuth: (token: string, usuario: AuthState['usuario']) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            usuario: null,
            setAuth: (token, usuario) => {
                set({ token, usuario });
            },
            logout: () => {
                set({ token: null, usuario: null });
                // Limpiar cualquier otra data cacheada
                window.location.href = '/login';
            },
            isAuthenticated: () => {
                const state = get();
                if (!state.token) return false;
                // Verificar expiración del lado del cliente
                try {
                    const payload = JSON.parse(atob(state.token.split('.')[1]));
                    return payload.exp * 1000 > Date.now();
                } catch {
                    return false;
                }
            },
        }),
        {
            name: 'auth-storage',
            // No persistir la función isAuthenticated
            partialize: (state) => ({
                token: state.token,
                usuario: state.usuario,
            }),
        },
    ),
);
```

### 2. Interceptor de Axios para Adjuntar el Token

```typescript
// services/api.ts
import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: { 'Content-Type': 'application/json' },
});

// REQUEST INTERCEPTOR: Adjuntar token automáticamente
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// RESPONSE INTERCEPTOR: Manejar errores de autenticación globalmente
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const mensaje = error.response?.data?.message || '';

            // Si el token expiró o es inválido, cerrar sesión y redirigir
            if (
                mensaje.includes('expirado') ||
                mensaje.includes('inválido') ||
                mensaje.includes('Token') ||
                mensaje.includes('No autorizado')
            ) {
                useAuthStore.getState().logout();
            }
        }
        return Promise.reject(error);
    },
);

export default api;
```

### 3. Servicio de Autenticación

```typescript
// services/auth.service.ts
import api from './api';

export const authService = {
    async login(data: { email: string; password: string }) {
        const response = await api.post('/auth/login', data);
        return response.data; // { token, usuario }
    },

    async register(data: {
        nombre: string;
        email: string;
        password: string;
        confirmarPassword: string;
    }) {
        const response = await api.post('/auth/register', data);
        return response.data; // { token, usuario }
    },

    async obtenerPerfil() {
        const response = await api.get('/auth/perfil');
        return response.data;
    },
};
```

### 4. Lógica de Redirección de Rutas Protegidas

```typescript
// routes/PrivateRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useEffect, useState } from 'react';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { token, isAuthenticated, logout } = useAuthStore();
    const location = useLocation();
    const [verificando, setVerificando] = useState(true);

    useEffect(() => {
        // Verificar expiración al montar el componente
        if (token && !isAuthenticated()) {
            logout(); // Token expirado, cerrar sesión
        }
        setVerificando(false);
    }, [token, isAuthenticated, logout]);

    if (verificando) {
        return <LoadingSpinner />; // Mostrar spinner mientras se verifica
    }

    if (!token || !isAuthenticated()) {
        // Guardar la ruta actual para redirigir después del login
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return <>{children}</>;
}
```

### 5. Redirección Post-Login

```typescript
// components/auth/LoginForm.tsx
export function LoginForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const setAuth = useAuthStore((state) => state.setAuth);

    const from = (location.state as any)?.from || '/dashboard';

    const mutation = useMutation({
        mutationFn: authService.login,
        onSuccess: (data) => {
            setAuth(data.token, data.usuario);
            navigate(from, { replace: true }); // Redirigir a la ruta original
        },
    });

    // ...
}
```

### 6. Manejo de Expiración en el Cliente

```typescript
// utils/token.ts
export function decodificarToken(token: string): { sub: number; email: string; exp: number } | null {
    try {
        const payload = token.split('.')[1];
        // El payload está en base64url, convertir a base64 estándar
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

export function tokenExpirado(token: string): boolean {
    const decoded = decodificarToken(token);
    if (!decoded) return true;
    return decoded.exp * 1000 < Date.now();
}

export function tiempoRestanteToken(token: string): number {
    const decoded = decodificarToken(token);
    if (!decoded) return 0;
    // Retorna segundos restantes
    return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
}
```

---

## Consideraciones de Seguridad

| Aspecto | Implementación |
|---|---|
| **Almacenamiento del token** | localStorage con persistencia en zustand |
| **Transmisión** | Solo por HTTPS en producción. Header `Authorization: Bearer <token>` |
| **Expiración** | 7 días desde la emisión. Verificada tanto en backend (Passport) como en frontend (cliente) |
| **Firma** | HS256 con clave secreta de 256 bits mínimos |
| **Rotación de token** | No implementada. El token es válido hasta su expiración. Para renovar, el usuario debe volver a iniciar sesión |
| **Cierre de sesión** | Eliminación del token del store + localStorage. No hay blacklist de tokens (stateless) |
| **Protección CSRF** | No aplica para SPA con JWT en header (no usa cookies) |
| **XSS** | El token en localStorage es vulnerable a XSS. Mitigación: sanitización de inputs, Content-Security-Policy |
| **Rate limiting** | Recomendado en endpoints `/auth/login` y `/auth/register` para prevenir fuerza bruta |

---

## Diagrama de Flujo Completo

```
┌──────────┐          ┌──────────┐          ┌──────────┐
│  Cliente │          │ Backend  │          │   DB     │
│ (React)  │          │ (NestJS) │          │ (MySQL)  │
└────┬─────┘          └────┬─────┘          └────┬─────┘
     │                     │                     │
     │  POST /auth/login   │                     │
     │  { email, pass }    │                     │
     │────────────────────>│                     │
     │                     │  SELECT * FROM      │
     │                     │  usuario WHERE      │
     │                     │  email = ?          │
     │                     │────────────────────>│
     │                     │                     │
     │                     │  <──── usuario ─────│
     │                     │                     │
     │                     │  bcrypt.compare()   │
     │                     │                     │
     │                     │  Generar JWT        │
     │                     │  { sub, email,      │
     │                     │    iat, exp }       │
     │                     │                     │
     │  <─── { token,     │                     │
     │    usuario } ───────│                     │
     │                     │                     │
     │  Guardar token en   │                     │
     │  localStorage       │                     │
     │                     │                     │
     │  GET /api/progreso  │                     │
     │  Authorization:     │                     │
     │  Bearer <token>     │                     │
     │────────────────────>│                     │
     │                     │  Passport JWT       │
     │                     │  Strategy:          │
     │                     │  ✓ Firma HMAC       │
     │                     │  ✓ exp no vencido   │
     │                     │  ✓ payload válido   │
     │                     │                     │
     │                     │  req.user =         │
     │                     │  { usuarioId, email}│
     │                     │                     │
     │  <─── datos         │                     │
     │  protegidos ────────│                     │
     │                     │                     │
```
