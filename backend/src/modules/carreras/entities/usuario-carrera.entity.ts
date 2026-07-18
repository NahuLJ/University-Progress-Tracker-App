import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Carrera } from './carrera.entity';
import { ProgresoMateria } from '../../progreso/entities/progreso-materia.entity';
import { PeriodoPlanificacion } from '../../planificacion/entities/periodo-planificacion.entity';

@Entity('usuario_carrera')
@Unique(['usuario', 'carrera'])
export class UsuarioCarrera {
  @PrimaryGeneratedColumn()
  usuarioCarreraId: number;

  @ManyToOne(() => Usuario, (u) => u.usuarioCarreras)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Carrera, (c) => c.usuarioCarreras)
  @JoinColumn({ name: 'carrera_id' })
  carrera: Carrera;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: string;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => ProgresoMateria, (pm) => pm.usuarioCarrera)
  progresos: ProgresoMateria[];

  @OneToMany(() => PeriodoPlanificacion, (pp) => pp.usuarioCarrera)
  periodos: PeriodoPlanificacion[];
}
