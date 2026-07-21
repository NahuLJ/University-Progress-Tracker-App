import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Materia } from './materia.entity';
import { Carrera } from '../../carreras/entities/carrera.entity';

@Entity('correlativa')
@Unique(['materia', 'materiaCorrelativa', 'carrera'])
export class Correlativa {
  @PrimaryGeneratedColumn()
  correlativaId: number;

  @Index('IDX_correlativa_materia_id')
  @ManyToOne(() => Materia, (m) => m.correlativasRequeridas)
  @JoinColumn({ name: 'materia_id' })
  materia: Materia;

  @Index('IDX_correlativa_materia_correlativa_id')
  @ManyToOne(() => Materia, (m) => m.esCorrelativaDe)
  @JoinColumn({ name: 'materia_correlativa_id' })
  materiaCorrelativa: Materia;

  @ManyToOne(() => Carrera, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carrera_id' })
  carrera?: Carrera;
}
