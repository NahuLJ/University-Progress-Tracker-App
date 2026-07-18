import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UsuarioCarrera } from '../../carreras/entities/usuario-carrera.entity';
import { Materia } from '../../materias/entities/materia.entity';
import { EstadoMateria } from './estado-materia.entity';

@Entity('progreso_materia')
@Unique(['usuarioCarrera', 'materia'])
export class ProgresoMateria {
  @PrimaryGeneratedColumn()
  progresoId: number;

  @ManyToOne(() => UsuarioCarrera, (uc) => uc.progresos)
  @JoinColumn({ name: 'usuario_carrera_id' })
  usuarioCarrera: UsuarioCarrera;

  @ManyToOne(() => Materia)
  @JoinColumn({ name: 'materia_id' })
  materia: Materia;

  @ManyToOne(() => EstadoMateria)
  @JoinColumn({ name: 'estado_id' })
  estado: EstadoMateria;

  @Column({ type: 'int', nullable: true })
  nota: number | null;

  @Column({ type: 'enum', enum: ['Final', 'Promocion'], nullable: true })
  tipoAprobacion: string | null;

  @Column({ name: 'fecha_completado', type: 'date', nullable: true })
  fechaCompletado: string | null;

  @Column({
    name: 'fecha_actualizacion',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  fechaActualizacion: Date;
}
