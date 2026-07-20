import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './entities/usuario.entity';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { Carrera } from '../carreras/entities/carrera.entity';
import { CarreraMateria } from '../carreras/entities/carrera-materia.entity';
import { ProgresoMateria } from '../progreso/entities/progreso-materia.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      UsuarioCarrera,
      Carrera,
      CarreraMateria,
      ProgresoMateria,
    ]),
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
