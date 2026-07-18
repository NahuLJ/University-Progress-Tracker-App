import { DataSource } from 'typeorm';
import { BloqueHorario } from '../../modules/planificacion/entities/bloque-horario.entity';

export async function seedBloquesHorarios(dataSource: DataSource) {
  const repo = dataSource.getRepository(BloqueHorario);

  const bloques = [
    { bloqueId: 1, horaInicio: '08:00', horaFin: '10:00' },
    { bloqueId: 2, horaInicio: '10:00', horaFin: '12:00' },
    { bloqueId: 3, horaInicio: '12:00', horaFin: '14:00' },
    { bloqueId: 4, horaInicio: '14:00', horaFin: '16:00' },
    { bloqueId: 5, horaInicio: '16:00', horaFin: '18:00' },
    { bloqueId: 6, horaInicio: '18:00', horaFin: '20:00' },
    { bloqueId: 7, horaInicio: '20:00', horaFin: '22:00' },
  ];

  for (const bloque of bloques) {
    const exists = await repo.findOne({ where: { bloqueId: bloque.bloqueId } });
    if (!exists) {
      await repo.save(bloque);
    }
  }
}
