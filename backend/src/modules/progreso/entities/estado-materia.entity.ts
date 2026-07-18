import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProgresoMateria } from './progreso-materia.entity';

@Entity('estado_materia')
export class EstadoMateria {
  @PrimaryGeneratedColumn()
  estadoId: number;

  @Column({ length: 20, unique: true })
  nombre: string;

  @OneToMany(() => ProgresoMateria, (pm) => pm.estado)
  progresos: ProgresoMateria[];
}
