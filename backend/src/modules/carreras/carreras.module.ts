import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarrerasController } from './carreras.controller';
import { CarrerasService } from './carreras.service';
import { Carrera } from './entities/carrera.entity';
import { CarreraMateria } from './entities/carrera-materia.entity';
import { Materia } from '../materias/entities/materia.entity';
import { UsuarioCarrera } from './entities/usuario-carrera.entity';
import { ProgresoMateria } from '../progreso/entities/progreso-materia.entity';
import { MateriaPlanificada } from '../planificacion/entities/materia-planificada.entity';
import { Correlativa } from '../materias/entities/correlativa.entity';
import { CreditosModule } from '../creditos/creditos.module';

@Module({
  imports: [
    CreditosModule,
    TypeOrmModule.forFeature([
      Carrera,
      CarreraMateria,
      Materia,
      UsuarioCarrera,
      ProgresoMateria,
      MateriaPlanificada,
      Correlativa,
    ]),
  ],
  controllers: [CarrerasController],
  providers: [CarrerasService],
  exports: [CarrerasService],
})
export class CarrerasModule {}
