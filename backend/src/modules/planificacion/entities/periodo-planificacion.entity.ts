import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UsuarioCarrera } from '../../carreras/entities/usuario-carrera.entity';
import { MateriaPlanificada } from './materia-planificada.entity';
import { Trayectoria } from '../../trayectoria/entities/trayectoria.entity';

@Entity('periodo_planificacion')
export class PeriodoPlanificacion {
  @PrimaryGeneratedColumn()
  periodoId: number;

  @ManyToOne(() => UsuarioCarrera, (uc) => uc.periodos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_carrera_id' })
  usuarioCarrera: UsuarioCarrera;

  @ManyToOne(() => Trayectoria, (t) => t.planificaciones, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'trayectoria_id' })
  trayectoria?: Trayectoria;

  @Column({ name: 'trayectoria_id', type: 'int', nullable: true })
  trayectoriaId: number | null;

  @Column({ type: 'int' })
  anio: number;

  @Column({
    type: 'enum',
    enum: ['Verano', '1er Cuatrimestre', '2do Cuatrimestre'],
  })
  instancia: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre: string;

  @ManyToOne(() => PeriodoPlanificacion, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'planificacion_origen_id' })
  planificacionOrigen?: PeriodoPlanificacion;

  @Column({ name: 'planificacion_origen_id', type: 'int', nullable: true })
  planificacionOrigenId: number | null;

  @OneToMany(() => PeriodoPlanificacion, (pp) => pp.planificacionOrigen)
  continuaciones: PeriodoPlanificacion[];

  @OneToMany(() => MateriaPlanificada, (mp) => mp.periodo, { cascade: true })
  materiasPlanificadas: MateriaPlanificada[];
}
