import { Link } from 'react-router-dom';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { QueryError } from '../components/common/QueryError';
import { CategoriaCreditosCard } from '../components/creditos/CategoriaCreditosCard';
import { CreditosResumenCard } from '../components/creditos/CreditosResumenCard';
import { useCarreraActiva } from '../hooks/useCarreras';
import { useCreditos } from '../hooks/useCreditos';

export function CreditosPage() {
    const { usuarioCarreraId, isLoading: cargandoCarrera } = useCarreraActiva();
    const { progreso, marcarCompletada, desmarcar } = useCreditos(usuarioCarreraId);

    if (cargandoCarrera || progreso.isLoading) {
        return <LoadingSpinner />;
    }

    if (progreso.isError) {
        return <QueryError error={progreso.error} onRetry={() => progreso.refetch()} />;
    }

    if (!usuarioCarreraId) {
        return (
            <EmptyState
                iconName="books"
                title="Sin carrera activa"
                description="Inscribite a una carrera para seguir tu progreso de créditos."
                action={
                    <Link to="/carreras" className="btn-primary">
                        Ver carreras
                    </Link>
                }
            />
        );
    }

    if (!progreso.data?.sistemaCreditos) {
        return (
            <EmptyState
                iconName="circle"
                title="Esta carrera no tiene sistema de créditos"
                description="La carrera activa no exige créditos por actividades."
            />
        );
    }

    const data = progreso.data;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Créditos por actividades</h1>
                <p className="text-sm text-text-muted mt-1">
                    Progreso del sistema de créditos de tu carrera activa.
                </p>
            </div>

            <CreditosResumenCard data={data} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.categorias.map((cat) => (
                    <CategoriaCreditosCard
                        key={cat.categoriaCreditoId}
                        categoria={cat}
                        actividades={data.actividades.filter(
                            (a) => a.categoriaCreditoId === cat.categoriaCreditoId,
                        )}
                        marcarCompletada={marcarCompletada}
                        desmarcar={desmarcar}
                    />
                ))}
            </div>
        </div>
    );
}

export default CreditosPage;
