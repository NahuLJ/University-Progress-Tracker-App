import { DataSource } from 'typeorm';
import { seedEstadosMateria } from './01-estados-materia';
import { seedBloquesHorarios } from './02-bloques-horarios';
import { seedCarrerasPrueba } from './03-carreras-prueba';

export async function runSeeds(dataSource: DataSource) {
  await seedEstadosMateria(dataSource);
  await seedBloquesHorarios(dataSource);
  await seedCarrerasPrueba(dataSource);
}
