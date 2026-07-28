import { useState } from 'react';
import { AdminTabs } from '../components/admin/AdminTabs';
import { TablaCarreras } from '../components/admin/TablaCarreras';
import { TablaMaterias } from '../components/admin/TablaMaterias';
import { CrearCarreraModal } from '../components/admin/CrearCarreraModal';
import { CrearMateriaModal } from '../components/admin/CrearMateriaModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useLocalStorage } from '../hooks/useLocalStorage';

type TabKey = 'carreras' | 'materias';

export function AdminPage() {
    const [tab, setTab] = useLocalStorage<TabKey>('admin-tab', 'carreras');
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
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white">Carreras</h2>
                        <Button onClick={() => setCarreraModalOpen(true)}>Nueva carrera</Button>
                    </div>
                    <TablaCarreras />
                </Card>
            )}

            {tab === 'materias' && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white">Materias</h2>
                        <Button onClick={() => setMateriaModalOpen(true)}>Nueva materia</Button>
                    </div>
                    <TablaMaterias />
                </Card>
            )}

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