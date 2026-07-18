import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MateriasController } from './materias.controller';
import { MateriasService } from './materias.service';
import { Materia } from './entities/materia.entity';
import { Correlativa } from './entities/correlativa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Materia, Correlativa])],
  controllers: [MateriasController],
  providers: [MateriasService],
  exports: [MateriasService],
})
export class MateriasModule {}
