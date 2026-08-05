import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { ActividadCredito } from './actividad-credito.entity';

@Entity('progreso_actividad')
@Unique(['usuario', 'actividad'])
export class ProgresoActividad {
  @PrimaryGeneratedColumn()
  progresoActividadId: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => ActividadCredito, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_credito_id' })
  actividad: ActividadCredito;

  @Column({ default: false })
  completada: boolean;

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
