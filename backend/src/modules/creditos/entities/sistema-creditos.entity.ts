import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { Carrera } from '../../carreras/entities/carrera.entity';

@Entity('sistema_creditos')
@Check('total_creditos > 0')
export class SistemaCreditos {
  @PrimaryGeneratedColumn()
  sistemaCreditosId: number;

  @OneToOne(() => Carrera, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carrera_id' })
  carrera: Carrera;

  @Column({ name: 'total_creditos', type: 'int' })
  totalCreditos: number;
}
