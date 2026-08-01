import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Materia } from '../../materias/entities/materia.entity';
import { EstadoMateria } from './estado-materia.entity';

@Entity('progreso_materia')
@Unique(['usuario', 'materia'])
export class ProgresoMateria {
  @PrimaryGeneratedColumn()
  progresoId: number;

  @ManyToOne(() => Usuario, (u) => u.progresos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Materia, { onDelete: 'CASCADE' })
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
