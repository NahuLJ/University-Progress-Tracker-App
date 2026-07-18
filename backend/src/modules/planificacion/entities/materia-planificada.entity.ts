import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { PeriodoPlanificacion } from './periodo-planificacion.entity';
import { Materia } from '../../materias/entities/materia.entity';
import { BloqueHorario } from './bloque-horario.entity';

@Entity('materia_planificada')
@Unique(['periodo', 'bloque', 'diaSemana'])
export class MateriaPlanificada {
  @PrimaryGeneratedColumn()
  planificacionId: number;

  @ManyToOne(() => PeriodoPlanificacion, (pp) => pp.materiasPlanificadas)
  @JoinColumn({ name: 'periodo_id' })
  periodo: PeriodoPlanificacion;

  @ManyToOne(() => Materia)
  @JoinColumn({ name: 'materia_id' })
  materia: Materia;

  @ManyToOne(() => BloqueHorario, (bh) => bh.materiasPlanificadas)
  @JoinColumn({ name: 'bloque_id' })
  bloque: BloqueHorario;

  @Column({
    type: 'enum',
    enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  })
  diaSemana: string;
}
