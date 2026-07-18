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
        fortaleza >= 80 ? { label: 'Fuerte', color: 'bg-green-500', text: 'text-green-600' }
        : fortaleza >= 60 ? { label: 'Buena', color: 'bg-blue-500', text: 'text-blue-600' }
        : fortaleza >= 40 ? { label: 'Media', color: 'bg-yellow-500', text: 'text-yellow-600' }
        : { label: 'Débil', color: 'bg-red-500', text: 'text-red-600' };

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
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
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

            <p className="text-center text-sm text-gray-500">
                ¿Ya tenés cuenta?{' '}
                <a href="/login" className="text-blue-600 hover:underline">Iniciá sesión</a>
            </p>
        </form>
    );
}