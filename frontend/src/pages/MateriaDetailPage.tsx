import { useParams, useNavigate } from 'react-router-dom';
import { useMateriaDetalle } from '../hooks/useMateriaDetalle';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { QueryError } from '../components/common/QueryError';

interface GrupoReq {
    carreraNombre: string;
    items: { correlativaId: number; materiaCorrelativaNombre: string; materiaCorrelativaCodigo: string; materiaCorrelativaId: number }[];
}

interface GrupoEsc {
    carreraNombre: string;
    items: { correlativaId: number; materiaNombre: string; materiaCodigo: string; materiaId: number }[];
}

function groupReq(corr: any[]): GrupoReq[] {
    const map = new Map<number, GrupoReq>();
    for (const c of corr) {
        const car = c.carrera;
        if (!map.has(car.carreraId)) {
            map.set(car.carreraId, { carreraNombre: car.nombre, items: [] });
        }
        map.get(car.carreraId)!.items.push({
            correlativaId: c.correlativaId,
            materiaCorrelativaNombre: c.materiaCorrelativa.nombre,
            materiaCorrelativaCodigo: c.materiaCorrelativa.codigo,
            materiaCorrelativaId: c.materiaCorrelativa.materiaId,
        });
    }
    return Array.from(map.values());
}

function groupEsc(corr: any[]): GrupoEsc[] {
    const map = new Map<number, GrupoEsc>();
    for (const c of corr) {
        const car = c.carrera;
        if (!map.has(car.carreraId)) {
            map.set(car.carreraId, { carreraNombre: car.nombre, items: [] });
        }
        map.get(car.carreraId)!.items.push({
            correlativaId: c.correlativaId,
            materiaNombre: c.materia.nombre,
            materiaCodigo: c.materia.codigo,
            materiaId: c.materia.materiaId,
        });
    }
    return Array.from(map.values());
}

export function MateriaDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const materiaId = Number(id);

    const { data: materia, isLoading, isError, error, refetch } = useMateriaDetalle(materiaId);

    if (isLoading) return <LoadingSpinner />;
    if (isError) return <QueryError error={error} onRetry={() => refetch()} />;
    if (!materia) return null;

    const reqGroups = groupReq((materia as any).correlativasRequeridas ?? []);
    const escGroups = groupEsc((materia as any).esCorrelativaDe ?? []);

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

            <Card title="Información general">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-slate-400">Código:</span>{' '}
                        <Badge variant="info">{materia.codigo}</Badge>
                    </div>
                    <div className="col-span-2"><span className="text-slate-400">Descripción:</span> <span className="text-white">{materia.descripcion ?? '-'}</span></div>
                    <div>
                        <span className="text-slate-400">Carga horaria:</span>{' '}
                        <Badge variant="default">{materia.cargaHoraria}h</Badge>
                    </div>
                    <div>
                        <span className="text-slate-400">Créditos:</span>{' '}
                        <Badge variant="default">{materia.creditos}</Badge>
                    </div>
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
                    {reqGroups.length === 0 ? (
                        <p className="text-sm text-slate-400">No requiere correlativas.</p>
                    ) : (
                        <div className="space-y-4">
                            {reqGroups.map((g) => (
                                <div key={g.carreraNombre}>
                                    <h4 className="text-sm font-medium text-neon-cyan mb-2">{g.carreraNombre}</h4>
                                    <ul className="space-y-2">
                                        {g.items.map((c) => (
                                            <li key={c.correlativaId} className="flex items-center justify-between bg-base-700/60 rounded-lg px-3 py-2">
                                                <span className="text-sm text-slate-200">
                                                    {c.materiaCorrelativaNombre}{' '}
                                                    <span className="text-slate-400">({c.materiaCorrelativaCodigo})</span>
                                                </span>
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/materias/${c.materiaCorrelativaId}`)}>
                                                    Ver materia
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card title="Es correlativa de">
                    {escGroups.length === 0 ? (
                        <p className="text-sm text-slate-400">No es correlativa de ninguna materia.</p>
                    ) : (
                        <div className="space-y-4">
                            {escGroups.map((g) => (
                                <div key={g.carreraNombre}>
                                    <h4 className="text-sm font-medium text-neon-cyan mb-2">{g.carreraNombre}</h4>
                                    <ul className="space-y-2">
                                        {g.items.map((c) => (
                                            <li key={c.correlativaId} className="flex items-center justify-between bg-base-700/60 rounded-lg px-3 py-2">
                                                <span className="text-sm text-slate-200">
                                                    {c.materiaNombre}{' '}
                                                    <span className="text-slate-400">({c.materiaCodigo})</span>
                                                </span>
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/materias/${c.materiaId}`)}>
                                                    Ver materia
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}