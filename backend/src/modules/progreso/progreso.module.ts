import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgresoController } from './progreso.controller';
import { ProgresoService } from './progreso.service';
import { ProgresoMateria } from './entities/progreso-materia.entity';
import { EstadoMateria } from './entities/estado-materia.entity';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { CarreraMateria } from '../carreras/entities/carrera-materia.entity';
import { Correlativa } from '../materias/entities/correlativa.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgresoMateria,
      EstadoMateria,
      UsuarioCarrera,
      CarreraMateria,
      Correlativa,
    ]),
  ],
  controllers: [ProgresoController],
  providers: [ProgresoService],
  exports: [ProgresoService],
})
export class ProgresoModule {}
