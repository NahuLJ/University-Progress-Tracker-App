import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CarreraActividadCredito } from './carrera-actividad-credito.entity';
import { Materia } from '../../materias/entities/materia.entity';

@Entity('carrera_actividad_requisito_materia')
@Unique(['carreraActividad', 'materia'])
export class CarreraActividadRequisitoMateria {
  @PrimaryGeneratedColumn()
  carreraActividadRequisitoMateriaId: number;

  @ManyToOne(() => CarreraActividadCredito, (ca) => ca.materiasRequeridas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'carrera_actividad_credito_id' })
  carreraActividad: CarreraActividadCredito;

  @ManyToOne(() => Materia, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'materia_id' })
  materia: Materia;
}
