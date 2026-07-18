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
            setAuth(response.token, {
                id: response.usuario.usuarioId,
                nombre: response.usuario.nombre,
                email: response.usuario.email,
            });
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
            setAuth(response.token, {
                id: response.usuario.usuarioId,
                nombre: response.usuario.nombre,
                email: response.usuario.email,
            });
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