import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Materia } from './materia.entity';

@Entity('correlativa')
@Unique(['materia', 'materiaCorrelativa'])
export class Correlativa {
  @PrimaryGeneratedColumn()
  correlativaId: number;

  @ManyToOne(() => Materia, (m) => m.correlativasRequeridas)
  @JoinColumn({ name: 'materia_id' })
  materia: Materia;

  @ManyToOne(() => Materia, (m) => m.esCorrelativaDe)
  @JoinColumn({ name: 'materia_correlativa_id' })
  materiaCorrelativa: Materia;
}
