import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditosController } from './creditos.controller';
import { CreditosService } from './creditos.service';
import { SistemaCreditos } from './entities/sistema-creditos.entity';
import { CategoriaCredito } from './entities/categoria-credito.entity';
import { ActividadCredito } from './entities/actividad-credito.entity';
import { ActividadRequisitoMateria } from './entities/actividad-requisito-materia.entity';
import { CarreraCategoriaCredito } from './entities/carrera-categoria-credito.entity';
import { CarreraActividadCredito } from './entities/carrera-actividad-credito.entity';
import { ProgresoActividad } from './entities/progreso-actividad.entity';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { Materia } from '../materias/entities/materia.entity';
import { ProgresoMateria } from '../progreso/entities/progreso-materia.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SistemaCreditos,
      CategoriaCredito,
      ActividadCredito,
      ActividadRequisitoMateria,
      CarreraCategoriaCredito,
      CarreraActividadCredito,
      ProgresoActividad,
      UsuarioCarrera,
      Materia,
      ProgresoMateria,
    ]),
  ],
  controllers: [CreditosController],
  providers: [CreditosService],
  exports: [CreditosService],
})
export class CreditosModule {}
