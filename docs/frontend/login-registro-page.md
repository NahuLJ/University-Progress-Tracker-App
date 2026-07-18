# Página Login / Registro — Especificación Técnica (implementada)

> **Estado de implementación:** ✅ Completa. `LoginForm` y `RegisterForm` usan RHF + Zod y `useMutation`
> sobre `auth.service` (`login`/`register`). En `onSuccess` llaman a `setAuth(token, usuario)` y navegan a
> `/dashboard`. El registro incluye barra de fortaleza inline. Sin datos mockeados; el backend valida
> email duplicado y credenciales.

## Estructura de Componentes (real)

```
pages/
├── LoginPage.tsx              # layout centrado + <LoginForm />
└── RegisterPage.tsx           # layout centrado + <RegisterForm />

components/auth/
├── LoginForm.tsx              # email + password, RHF + Zod
└── RegisterForm.tsx           # nombre + email + password + confirmar, RHF + Zod + barra de fortaleza inline

components/ui/
├── Input.tsx                  # label, error, helper
├── Button.tsx                 # variant primary/outline/ghost, loading
└── Alert.tsx                  # variant success/error/warning/info

hooks/
└── useAuthForm.ts             # useLoginForm() + useRegisterForm()

services/
└── auth.service.ts            # login(), register(), obtenerPerfil()

store/auth.store.ts            # zustand + persist: token, usuario, setAuth, logout, isAuthenticated
```

> Nota: no existe `AuthCard.tsx` ni `PasswordStrengthBar.tsx`. El layout lo resuelven las páginas
> directamente y la barra de fortaleza en el registro es un bloque inline dentro de `RegisterForm`.

### Árbol de Composición

```
AuthLayout (centrado)
└── LoginPage / RegisterPage
    ├── Título "Seguimiento Universitario" + subtítulo
    └── LoginForm | RegisterForm
        ├── Input (email)
        ├── Input (password)  [type=password]
        ├── [Registro] barra de fortaleza inline (longitud >= 8 → "Buena", sino "Débil")
        ├── [Registro] Input (confirmar password)
        ├── Button (submit, loading mientras muta)
        └── Link a /registro | /login
```

---

## Manejo del Estado Local

### Hook Personalizado: `useAuthForm` (`hooks/useAuthForm.ts`)

```typescript
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
}).refine((data) => data.password === data.confrarPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarPassword'],
});
```

Ambos hooks usan `useMutation` sobre `authService.login/register`. En `onSuccess` llaman a
`setAuth(response.token, response.usuario)` (del `auth.store`) y navegan a `/dashboard`.
En `onError` setean `form.setError('root', ...)` con el mensaje del backend o un fallback.

### Estado de Sesión (zustand, `store/auth.store.ts`)

`auth.store` persiste `token` y `usuario` en `localStorage` (clave `auth-storage`). `isAuthenticated()`
decodifica el JWT y valida `exp`. `logout()` limpia el estado y redirige a `/login`.

---

## Comportamiento UX/UI

### LoginForm

```typescript
export function LoginForm() {
    const { form, mutation } = useLoginForm();
    const { register, handleSubmit, formState: { errors } } = form;
    return (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            {errors.root && <Alert variant="error">{errors.root.message}</Alert>}
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Contraseña" type="password" error={errors.password?.message} {...register('password')} />
            <Button type="submit" loading={mutation.isPending} className="w-full">Iniciar Sesión</Button>
            <p className="text-center text-sm text-gray-500">
                ¿No tenés cuenta? <a href="/registro" className="text-blue-600 hover:underline">Registrate</a>
            </p>
        </form>
    );
}
```

### RegisterForm

Renderiza nombre, email, password y confirmación. Muestra una barra de fortaleza **inline**:
ancho 50%/100% y color rojo/verde según `password.length >= 8`, con etiqueta "Débil"/"Buena".
(No usa `utils/fortaleza.ts`; es una versión simplificada respecto a la especificación original.)

---

## Validaciones del Lado del Cliente

| Campo | Regla | Feedback visual |
|---|---|---|
| nombre | Requerido, 2–150 caracteres | Borde rojo + texto |
| email | Formato email válido | Borde rojo + "Email inválido" |
| password | Mín 8 chars, 1 mayúscula, 1 minúscula, 1 número, 1 especial | Validación Zod en `onSubmit` |
| confirmarPassword | Debe coincidir con password | Error en `confirmarPassword` |
| Error de servidor | Email duplicado / credenciales inválidas | `Alert` rojo sobre el formulario (`errors.root`) |
| Estado loading | Mientras se envía | Botón deshabilitado con spinner |

### Redirecciones Post-Autenticación

| Evento | Acción |
|---|---|
| Login/Registro exitoso | `navigate('/dashboard', { replace: true })` |
| Token expirado en sesión activa | `isAuthenticated()` devuelve false → `PrivateRoute` redirige a `/login` |
| Usuario autenticado visita `/login` | `PrivateRoute`/`AuthLayout` lo envían a `/dashboard` |
| Logout manual | `auth.store.logout()` → limpia estado y `window.location.href = '/login'` |
