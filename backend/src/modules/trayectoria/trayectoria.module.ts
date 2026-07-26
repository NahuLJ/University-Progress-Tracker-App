import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrayectoriaController } from './trayectoria.controller';
import { TrayectoriaService } from './trayectoria.service';
import { Trayectoria } from './entities/trayectoria.entity';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { PeriodoPlanificacion } from '../planificacion/entities/periodo-planificacion.entity';
import { MateriaPlanificada } from '../planificacion/entities/materia-planificada.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trayectoria,
      UsuarioCarrera,
      PeriodoPlanificacion,
      MateriaPlanificada,
    ]),
  ],
  controllers: [TrayectoriaController],
  providers: [TrayectoriaService],
  exports: [TrayectoriaService],
})
export class TrayectoriaModule {}
