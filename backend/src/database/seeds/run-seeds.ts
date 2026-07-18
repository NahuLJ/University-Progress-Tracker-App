import { DataSource } from 'typeorm';
import { seedEstadosMateria } from './01-estados-materia';
import { seedBloquesHorarios } from './02-bloques-horarios';

export async function runSeeds(dataSource: DataSource) {
  await seedEstadosMateria(dataSource);
  await seedBloquesHorarios(dataSource);
}
