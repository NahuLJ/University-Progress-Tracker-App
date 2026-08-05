import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Carrera } from '../../carreras/entities/carrera.entity';
import { ActividadCredito } from './actividad-credito.entity';

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
}
