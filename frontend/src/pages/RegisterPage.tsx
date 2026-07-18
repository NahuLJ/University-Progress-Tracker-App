import { RegisterForm } from '../components/auth/RegisterForm';

export function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold neon-text">Seguimiento Universitario</h1>
                    <p className="mt-2 text-sm text-slate-400">Crea tu cuenta para continuar</p>
                </div>
                <div className="card p-8 rounded-2xl">
                    <RegisterForm />
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;