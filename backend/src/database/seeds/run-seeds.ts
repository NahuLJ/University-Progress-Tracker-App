import { DataSource } from 'typeorm';
import { seedEstadosMateria } from './01-estados-materia';
import { seedBloquesHorarios } from './02-bloques-horarios';
import { seedLicenciaturaInformatica } from './03-licenciatura-informatica';
import { seedLicenciaturaCiberseguridad } from './04-licenciatura-ciberseguridad';
import { seedLicenciaturaVideojuegos } from './05-licenciatura-videojuegos';
import { seedTecnicaturaIA } from './06-tecnicatura-ia';

export async function runSeeds(dataSource: DataSource) {
  await seedEstadosMateria(dataSource);
  await seedBloquesHorarios(dataSource);
  await seedLicenciaturaInformatica(dataSource);
  await seedLicenciaturaCiberseguridad(dataSource);
  await seedLicenciaturaVideojuegos(dataSource);
  await seedTecnicaturaIA(dataSource);
}
