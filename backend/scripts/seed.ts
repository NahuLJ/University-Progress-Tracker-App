import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { runSeeds } from '../src/database/seeds/run-seeds';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  await runSeeds(dataSource);
  console.log('✓ Seeds ejecutados correctamente');
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Error al ejecutar seeds:', err.message);
  process.exit(1);
});
