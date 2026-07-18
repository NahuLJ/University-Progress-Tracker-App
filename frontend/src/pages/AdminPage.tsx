import { useState } from 'react';
import { AdminTabs } from '../components/admin/AdminTabs';
import { CrearCarreraModal } from '../components/admin/CrearCarreraModal';
import { CrearMateriaModal } from '../components/admin/CrearMateriaModal';
import { PlanEstudiosAdmin } from '../components/admin/PlanEstudiosAdmin';
import { MateriaCorrelativasAdmin } from '../components/admin/MateriaCorrelativasAdmin';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

type TabKey = 'carreras' | 'materias' | 'plan' | 'correlativas';

export function AdminPage() {
    const [tab, setTab] = useState<TabKey>('carreras');
    const [carreraModalOpen, setCarreraModalOpen] = useState(false);
    const [materiaModalOpen, setMateriaModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Administración académica</h1>
                    <p className="text-sm text-slate-400">
                        Gestioná el catálogo de carreras, materias y correlativas.
                    </p>
                </div>
            </div>

            <AdminTabs active={tab} onChange={setTab} />

            {tab === 'carreras' && (
                <Card className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Carreras</h2>
                        <Button onClick={() => setCarreraModalOpen(true)}>Nueva carrera</Button>
                    </div>
                    <p className="text-sm text-slate-300">
                        Creá una carrera y luego agregale materias desde la pestaña{' '}
                        <span className="font-medium text-white">Plan de estudios</span>.
                    </p>
                </Card>
            )}

            {tab === 'materias' && (
                <Card className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Materias</h2>
                        <Button onClick={() => setMateriaModalOpen(true)}>Nueva materia</Button>
                    </div>
                    <p className="text-sm text-slate-300">
                        Las materias creadas aquí forman el catálogo global y se usan al armar los planes de
                        estudio.
                    </p>
                </Card>
            )}

            {tab === 'plan' && <PlanEstudiosAdmin />}
            {tab === 'correlativas' && <MateriaCorrelativasAdmin />}

            <CrearCarreraModal
                isOpen={carreraModalOpen}
                onClose={() => setCarreraModalOpen(false)}
            />
            <CrearMateriaModal
                isOpen={materiaModalOpen}
                onClose={() => setMateriaModalOpen(false)}
            />
        </div>
    );
}
