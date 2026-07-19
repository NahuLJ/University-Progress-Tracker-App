import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarrerasController } from './carreras.controller';
import { CarrerasService } from './carreras.service';
import { Carrera } from './entities/carrera.entity';
import { CarreraMateria } from './entities/carrera-materia.entity';
import { Materia } from '../materias/entities/materia.entity';
import { UsuarioCarrera } from './entities/usuario-carrera.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Carrera,
      CarreraMateria,
      Materia,
      UsuarioCarrera,
    ]),
  ],
  controllers: [CarrerasController],
  providers: [CarrerasService],
  exports: [CarrerasService],
})
export class CarrerasModule {}
