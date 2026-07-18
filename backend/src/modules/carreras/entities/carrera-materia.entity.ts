import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Carrera } from './carrera.entity';
import { Materia } from '../../materias/entities/materia.entity';

@Entity('carrera_materia')
@Unique(['carrera', 'materia'])
export class CarreraMateria {
  @PrimaryGeneratedColumn()
  carreraMateriaId: number;

  @ManyToOne(() => Carrera, (c) => c.planEstudios)
  @JoinColumn({ name: 'carrera_id' })
  carrera: Carrera;

  @ManyToOne(() => Materia, (m) => m.planEstudios)
  @JoinColumn({ name: 'materia_id' })
  materia: Materia;

  @Column({ type: 'int' })
  anio: number;

  @Column({ type: 'int' })
  cuatrimestre: number;

  @Column({ type: 'int' })
  orden: number;
}
