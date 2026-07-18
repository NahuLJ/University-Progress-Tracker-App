import { DataSource } from 'typeorm';
import { EstadoMateria } from '../../modules/progreso/entities/estado-materia.entity';

export async function seedEstadosMateria(dataSource: DataSource) {
  const repo = dataSource.getRepository(EstadoMateria);

  const estados = [
    { estadoId: 1, nombre: 'Pendiente' },
    { estadoId: 2, nombre: 'En Proceso' },
    { estadoId: 3, nombre: 'Completada' },
  ];

  for (const estado of estados) {
    const exists = await repo.findOne({ where: { estadoId: estado.estadoId } });
    if (!exists) {
      await repo.save(estado);
    }
  }
}
