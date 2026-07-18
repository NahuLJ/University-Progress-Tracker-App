import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { CarrerasModule } from './modules/carreras/carreras.module';
import { MateriasModule } from './modules/materias/materias.module';
import { ProgresoModule } from './modules/progreso/progreso.module';
import { PlanificacionModule } from './modules/planificacion/planificacion.module';
import { EstadisticasModule } from './modules/estadisticas/estadisticas.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/auth.guard';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    UsuariosModule,
    CarrerasModule,
    MateriasModule,
    ProgresoModule,
    PlanificacionModule,
    EstadisticasModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
