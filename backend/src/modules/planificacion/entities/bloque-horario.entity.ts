import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MateriaPlanificada } from './materia-planificada.entity';

@Entity('bloque_horario')
export class BloqueHorario {
  @PrimaryGeneratedColumn()
  bloqueId: number;

  @Column({ type: 'time' })
  horaInicio: string;

  @Column({ type: 'time' })
  horaFin: string;

  @OneToMany(() => MateriaPlanificada, (mp) => mp.bloque)
  materiasPlanificadas: MateriaPlanificada[];
}
