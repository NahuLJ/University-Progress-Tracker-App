import { DataSource } from 'typeorm';
import { seedEstadosMateria } from './01-estados-materia';
import { seedBloquesHorarios } from './02-bloques-horarios';
import { seedLicenciaturaInformatica } from './03-licenciatura-informatica';

export async function runSeeds(dataSource: DataSource) {
  await seedEstadosMateria(dataSource);
  await seedBloquesHorarios(dataSource);
  await seedLicenciaturaInformatica(dataSource);
}
