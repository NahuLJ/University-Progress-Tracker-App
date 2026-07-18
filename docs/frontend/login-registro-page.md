# Página Login / Registro — Especificación Técnica

## Estructura de Componentes

```
pages/
└── LoginPage.tsx
└── RegisterPage.tsx

components/auth/
├── LoginForm.tsx
├── RegisterForm.tsx
└── AuthCard.tsx          # Wrapper visual con logo y título

components/ui/
├── Input.tsx
├── Button.tsx
├── Alert.tsx             # Mensajes de error/success
└── PasswordInput.tsx     # Input con toggle de visibilidad
```

### Árbol de Composición

```
AuthLayout
└── AuthCard
    ├── [Logo de la aplicación]
    ├── Título ( "Iniciar Sesión" | "Crear Cuenta" )
    │
    ├── LoginForm                    (ruta: /login)
    │   ├── Input (email)
    │   ├── PasswordInput
    │   ├── Button ("Ingresar")
    │   └── Link → /registro
    │
    └── RegisterForm                 (ruta: /registro)
        ├── Input (nombre completo)
        ├── Input (email)
        ├── PasswordInput (contraseña)
        ├── PasswordInput (confirmar contraseña)
        ├── Button ("Crear Cuenta")
        └── Link → /login
```

---

## Manejo del Estado Local

### Hook Personalizado: `useAuthForm`

```typescript
// hooks/useAuthForm.ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
});

const registerSchema = z.object({
    nombre: z.string().min(2, 'Mínimo 2 caracteres').max(150),
    email: z.string().email('Email inválido'),
    password: z
        .string()
        .min(8, 'Mínimo 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener una mayúscula')
        .regex(/[a-z]/, 'Debe contener una minúscula')
        .regex(/\d/, 'Debe contener un número')
        .regex(/[!@#$%^&*]/, 'Debe contener un carácter especial'),
    confirmarPassword: z.string(),
}).refine((data) => data.password === data.confirmarPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarPassword'],
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export function useLoginForm() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);

    const form = useForm<LoginData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const mutation = useMutation({
        mutationFn: (data: LoginData) => authService.login(data),
        onSuccess: (response) => {
            setAuth(response.token, response.usuario);
            navigate('/dashboard', { replace: true });
        },
        onError: (error: any) => {
            form.setError('root', {
                message: error.response?.data?.message || 'Error al iniciar sesión',
            });
        },
    });

    return { form, mutation };
}

export function useRegisterForm() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);

    const form = useForm<RegisterData>({
        resolver: zodResolver(registerSchema),
        defaultValues: { nombre: '', email: '', password: '', confirmarPassword: '' },
    });

    const mutation = useMutation({
        mutationFn: (data: RegisterData) => authService.register(data),
        onSuccess: (response) => {
            setAuth(response.token, response.usuario);
            navigate('/dashboard', { replace: true });
        },
        onError: (error: any) => {
            form.setError('root', {
                message: error.response?.data?.message || 'Error al registrarse',
            });
        },
    });

    return { form, mutation };
}
```

---

## Comportamiento UX/UI

### LoginForm

```typescript
// components/auth/LoginForm.tsx
export function LoginForm() {
    const { form, mutation } = useLoginForm();
    const { register, handleSubmit, formState: { errors } } = form;

    return (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            {errors.root && (
                <Alert variant="error">{errors.root.message}</Alert>
            )}

            <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                error={errors.email?.message}
                {...register('email')}
            />

            <PasswordInput
                label="Contraseña"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
            />

            <Button type="submit" loading={mutation.isPending} className="w-full">
                Iniciar Sesión
            </Button>

            <p className="text-center text-sm text-gray-500">
                ¿No tenés cuenta?{' '}
                <Link to="/registro" className="text-blue-600 hover:underline">Registrate</Link>
            </p>
        </form>
    );
}
```

### RegisterForm

```typescript
// components/auth/RegisterForm.tsx
export function RegisterForm() {
    const { form, mutation } = useRegisterForm();
    const { register, handleSubmit, watch, formState: { errors } } = form;

    const passwordValue = watch('password');
    const passwordStrength = calcularFortaleza(passwordValue);

    return (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            {errors.root && (
                <Alert variant="error">{errors.root.message}</Alert>
            )}

            <Input label="Nombre completo" placeholder="Juan Pérez"
                error={errors.nombre?.message} {...register('nombre')} />

            <Input label="Email" type="email" placeholder="tu@email.com"
                error={errors.email?.message} {...register('email')} />

            <PasswordInput label="Contraseña" placeholder="••••••••"
                error={errors.password?.message} {...register('password')} />

            {/* Indicador visual de fortaleza de contraseña */}
            {passwordValue && (
                <PasswordStrengthBar value={passwordStrength} />
            )}

            <PasswordInput label="Confirmar contraseña" placeholder="••••••••"
                error={errors.confirmarPassword?.message} {...register('confirmarPassword')} />

            <Button type="submit" loading={mutation.isPending} className="w-full">
                Crear Cuenta
            </Button>

            <p className="text-center text-sm text-gray-500">
                ¿Ya tenés cuenta?{' '}
                <Link to="/login" className="text-blue-600 hover:underline">Iniciá sesión</Link>
            </p>
        </form>
    );
}
```

---

## Validaciones del Lado del Cliente

| Campo | Regla | Feedback visual |
|---|---|---|
| nombre | Requerido, 2-150 caracteres | Borde rojo + texto "Mínimo 2 caracteres" |
| email | Formato email válido | Borde rojo + "Email inválido" |
| password | Mín 8 chars, 1 mayúscula, 1 minúscula, 1 número, 1 especial | Barra de fortaleza dinámica + lista de requisitos con checkmarks |
| confirmarPassword | Debe ser igual a password | Borde rojo + "Las contraseñas no coinciden" |
| Error de servidor | Email duplicado o credenciales inválidas | Alert rojo sobre el formulario |
| Estado loading | Mientras se envía la petición | Botón deshabilitado con spinner |

### Barra de Fortaleza de Contraseña

```
Fortaleza: [████████░░] 80% (Fuerte)
Criterios:
✅ Mínimo 8 caracteres
✅ Contiene mayúscula
✅ Contiene minúscula
✅ Contiene número
❌ Contiene carácter especial
```

---

## Redirecciones Post-Autenticación

| Evento | Acción |
|---|---|
| Login exitoso | `navigate('/dashboard', { replace: true })` |
| Registro exitoso | `navigate('/dashboard', { replace: true })` |
| Token expirado en sesión activa | `navigate('/login', { state: { from: rutaActual } })` |
| Usuario autenticado visita `/login` | Redirección automática a `/dashboard` (en `AuthLayout`) |
| Logout manual | `navigate('/login', { replace: true })` y limpieza de store |
