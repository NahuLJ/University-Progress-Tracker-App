import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ActividadCredito } from './actividad-credito.entity';
import { Materia } from '../../materias/entities/materia.entity';

@Entity('actividad_requisito_materia')
@Unique(['actividad', 'materia'])
export class ActividadRequisitoMateria {
  @PrimaryGeneratedColumn()
  actividadRequisitoMateriaId: number;

  @ManyToOne(() => ActividadCredito, (a) => a.materiasRequeridas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'actividad_credito_id' })
  actividad: ActividadCredito;

  @ManyToOne(() => Materia, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'materia_id' })
  materia: Materia;
}
