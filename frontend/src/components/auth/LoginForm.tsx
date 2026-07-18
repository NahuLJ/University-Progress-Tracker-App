import { useLoginForm } from '../../hooks/useAuthForm';
import { Input } from '../ui/Input';
import { PasswordInput } from '../ui/PasswordInput';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

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

            <p className="text-center text-sm text-slate-400">
                ¿No tenés cuenta?{' '}
                <a href="/registro" className="text-neon-cyan hover:underline">Registrate</a>
            </p>
        </form>
    );
}