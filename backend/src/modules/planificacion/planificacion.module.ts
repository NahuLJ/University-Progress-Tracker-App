import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanificacionController } from './planificacion.controller';
import { PlanificacionService } from './planificacion.service';
import { PeriodoPlanificacion } from './entities/periodo-planificacion.entity';
import { MateriaPlanificada } from './entities/materia-planificada.entity';
import { BloqueHorario } from './entities/bloque-horario.entity';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { Materia } from '../materias/entities/materia.entity';
import { Correlativa } from '../materias/entities/correlativa.entity';
import { ProgresoMateria } from '../progreso/entities/progreso-materia.entity';
import { CarreraMateria } from '../carreras/entities/carrera-materia.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PeriodoPlanificacion,
      MateriaPlanificada,
      BloqueHorario,
      UsuarioCarrera,
      Materia,
      Correlativa,
      ProgresoMateria,
      CarreraMateria,
    ]),
  ],
  controllers: [PlanificacionController],
  providers: [PlanificacionService],
  exports: [PlanificacionService],
})
export class PlanificacionModule {}
