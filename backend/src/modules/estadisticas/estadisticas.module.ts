import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadisticasController } from './estadisticas.controller';
import { EstadisticasService } from './estadisticas.service';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { CarreraMateria } from '../carreras/entities/carrera-materia.entity';
import { ProgresoMateria } from '../progreso/entities/progreso-materia.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioCarrera, CarreraMateria, ProgresoMateria]),
  ],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
  exports: [EstadisticasService],
})
export class EstadisticasModule {}
