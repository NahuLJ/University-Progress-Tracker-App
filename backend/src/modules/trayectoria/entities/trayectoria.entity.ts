import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UsuarioCarrera } from '../../carreras/entities/usuario-carrera.entity';
import { PeriodoPlanificacion } from '../../planificacion/entities/periodo-planificacion.entity';

@Entity('trayectoria')
export class Trayectoria {
  @PrimaryGeneratedColumn()
  trayectoriaId: number;

  @ManyToOne(() => UsuarioCarrera, (uc) => uc.trayectorias)
  @JoinColumn({ name: 'usuario_carrera_id' })
  usuarioCarrera: UsuarioCarrera;

  @Column({ name: 'usuario_carrera_id', type: 'int' })
  usuarioCarreraId: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creadoEn: Date;

  @OneToMany(() => PeriodoPlanificacion, (pp) => pp.trayectoria)
  planificaciones: PeriodoPlanificacion[];
}
