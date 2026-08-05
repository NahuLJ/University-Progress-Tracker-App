import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Carrera } from '../../carreras/entities/carrera.entity';
import { ActividadCredito } from './actividad-credito.entity';
import { CarreraActividadRequisitoMateria } from './carrera-actividad-requisito-materia.entity';

@Entity('carrera_actividad_credito')
@Unique(['carrera', 'actividad'])
export class CarreraActividadCredito {
  @PrimaryGeneratedColumn()
  carreraActividadCreditoId: number;

  @ManyToOne(() => Carrera, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carrera_id' })
  carrera: Carrera;

  @ManyToOne(() => ActividadCredito, (a) => a.carreras, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_credito_id' })
  actividad: ActividadCredito;

  @OneToMany(() => CarreraActividadRequisitoMateria, (r) => r.carreraActividad)
  materiasRequeridas: CarreraActividadRequisitoMateria[];
}
