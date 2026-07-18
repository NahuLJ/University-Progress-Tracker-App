import { useRegisterForm } from '../../hooks/useAuthForm';
import { Input } from '../ui/Input';
import { PasswordInput } from '../ui/PasswordInput';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { calcularFortaleza } from '../../utils/fortaleza';

export function RegisterForm() {
    const { form, mutation } = useRegisterForm();
    const { register, handleSubmit, watch, formState: { errors } } = form;

    const passwordValue = watch('password') || '';
    const fortaleza = calcularFortaleza(passwordValue);
    const nivelFortaleza =
        fortaleza >= 80 ? { label: 'Fuerte', color: 'bg-neon-green shadow-neon-green', text: 'text-neon-green' }
        : fortaleza >= 60 ? { label: 'Buena', color: 'bg-neon-cyan shadow-neon-cyan', text: 'text-neon-cyan' }
        : fortaleza >= 40 ? { label: 'Media', color: 'bg-neon-yellow', text: 'text-neon-yellow' }
        : { label: 'Débil', color: 'bg-neon-red', text: 'text-neon-red' };

    return (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            {errors.root && (
                <Alert variant="error">{errors.root.message}</Alert>
            )}

            <Input
                label="Nombre completo"
                placeholder="Juan Pérez"
                error={errors.nombre?.message}
                {...register('nombre')}
            />

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

            {passwordValue && (
                <div className="space-y-1">
                    <div className="h-2 w-full bg-base-600 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${nivelFortaleza.color}`}
                            style={{ width: `${fortaleza}%` }}
                        />
                    </div>
                    <p className={`text-xs ${nivelFortaleza.text}`}>
                        Fortaleza: {nivelFortaleza.label}
                    </p>
                </div>
            )}

            <PasswordInput
                label="Confirmar contraseña"
                placeholder="••••••••"
                error={errors.confirmarPassword?.message}
                {...register('confirmarPassword')}
            />

            <Button type="submit" loading={mutation.isPending} className="w-full">
                Crear Cuenta
            </Button>

            <p className="text-center text-sm text-slate-400">
                ¿Ya tenés cuenta?{' '}
                <a href="/login" className="text-neon-cyan hover:underline">Iniciá sesión</a>
            </p>
        </form>
    );
}