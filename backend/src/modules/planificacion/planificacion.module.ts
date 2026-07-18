import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanificacionController } from './planificacion.controller';
import { PlanificacionService } from './planificacion.service';
import { PeriodoPlanificacion } from './entities/periodo-planificacion.entity';
import { MateriaPlanificada } from './entities/materia-planificada.entity';
import { BloqueHorario } from './entities/bloque-horario.entity';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { Materia } from '../materias/entities/materia.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PeriodoPlanificacion,
      MateriaPlanificada,
      BloqueHorario,
      UsuarioCarrera,
      Materia,
    ]),
  ],
  controllers: [PlanificacionController],
  providers: [PlanificacionService],
  exports: [PlanificacionService],
})
export class PlanificacionModule {}
