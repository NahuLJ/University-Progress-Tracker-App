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

@Entity('periodo_planificacion')
export class PeriodoPlanificacion {
  @PrimaryGeneratedColumn()
  periodoId: number;

  @ManyToOne(() => UsuarioCarrera, (uc) => uc.periodos)
  @JoinColumn({ name: 'usuario_carrera_id' })
  usuarioCarrera: UsuarioCarrera;

  @Column({ type: 'int' })
  anio: number;

  @Column({
    type: 'enum',
    enum: ['Verano', '1er Cuatrimestre', '2do Cuatrimestre'],
  })
  instancia: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre: string;

  @OneToMany(() => MateriaPlanificada, (mp) => mp.periodo, { cascade: true })
  materiasPlanificadas: MateriaPlanificada[];
}
