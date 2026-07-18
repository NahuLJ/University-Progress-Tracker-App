import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="text-center space-y-4">
                <p className="text-6xl font-bold text-blue-600">404</p>
                <h1 className="text-2xl font-semibold text-gray-900">Página no encontrada</h1>
                <p className="text-gray-500">
                    La página que buscás no existe o fue movida.
                </p>
                <Link to="/dashboard">
                    <Button>Volver al inicio</Button>
                </Link>
            </div>
        </div>
    );
}

export default NotFoundPage;
