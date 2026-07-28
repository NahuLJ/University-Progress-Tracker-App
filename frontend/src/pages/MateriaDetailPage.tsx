import { useParams, useNavigate } from 'react-router-dom';
import { useMateriaDetalle } from '../hooks/useMateriaDetalle';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { QueryError } from '../components/common/QueryError';

export function MateriaDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const materiaId = Number(id);

    const { data: materia, isLoading, isError, error, refetch } = useMateriaDetalle(materiaId);

    if (isLoading) return <LoadingSpinner />;
    if (isError) return <QueryError error={error} onRetry={() => refetch()} />;
    if (!materia) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/admin')} className="text-slate-400 hover:text-white transition-colors">
                        <Icon name="arrowLeft" className="w-5 h-5" />
                    </button>
                    <div>
                        <p className="text-sm text-slate-400">Admin &gt; Materias &gt; {materia.nombre}</p>
                        <h1 className="text-2xl font-bold text-white">{materia.nombre}</h1>
                    </div>
                </div>
                <Button onClick={() => navigate(`/admin/materias/${materiaId}/editar`)}>
                    Editar materia
                </Button>
            </div>

            <div className="flex gap-2">
                <Badge variant="info">{materia.codigo}</Badge>
                <Badge variant="default">{materia.cargaHoraria}h</Badge>
                <Badge variant="default">{materia.creditos} créditos</Badge>
            </div>

            <Card title="Información general">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-400">Nombre:</span> <span className="text-white">{materia.nombre}</span></div>
                    <div><span className="text-slate-400">Código:</span> <span className="text-white font-mono">{materia.codigo}</span></div>
                    <div className="col-span-2"><span className="text-slate-400">Descripción:</span> <span className="text-white">{materia.descripcion ?? '-'}</span></div>
                    <div><span className="text-slate-400">Carga horaria:</span> <span className="text-white">{materia.cargaHoraria}h</span></div>
                    <div><span className="text-slate-400">Créditos:</span> <span className="text-white">{materia.creditos}</span></div>
                </div>
            </Card>

            {(materia as any).carreras && (materia as any).carreras.length > 0 && (
                <Card title="Carreras que la contienen">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-base-600 text-slate-400 text-left">
                                <th className="py-2 pr-4 font-medium">Carrera</th>
                                <th className="py-2 pr-4 font-medium">Año</th>
                                <th className="py-2 pr-4 font-medium">Cuatrimestre</th>
                                <th className="py-2 font-medium">Orden</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(materia as any).carreras.map((c: any) => (
                                <tr key={c.carreraId} className="border-b border-base-700/50">
                                    <td className="py-2 pr-4">
                                        <button onClick={() => navigate(`/carreras/${c.carreraId}`)} className="text-neon-cyan hover:underline">
                                            {c.nombre}
                                        </button>
                                    </td>
                                    <td className="py-2 pr-4 text-slate-300">{c.anio}</td>
                                    <td className="py-2 pr-4 text-slate-300">{c.cuatrimestre}</td>
                                    <td className="py-2 text-slate-300">{c.orden}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Correlativas requeridas">
                    {materia.correlativas.length === 0 ? (
                        <p className="text-sm text-slate-400">No requiere correlativas.</p>
                    ) : (
                        <ul className="space-y-2">
                            {materia.correlativas.map((c) => (
                                <li key={c.correlativaId} className="flex items-center justify-between bg-base-700/60 rounded-lg px-3 py-2">
                                    <span className="text-sm text-slate-200">
                                        {c.materiaCorrelativa.nombre} <span className="text-slate-400">({c.materiaCorrelativa.codigo})</span>
                                    </span>
                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/materias/${c.materiaCorrelativaId}`)}>
                                        Ver materia
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card title="Es correlativa de">
                    <p className="text-sm text-slate-400">No implementado en detalle.</p>
                </Card>
            </div>
        </div>
    );
}