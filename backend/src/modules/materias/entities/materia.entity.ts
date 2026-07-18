import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CarreraMateria } from '../../carreras/entities/carrera-materia.entity';
import { Correlativa } from './correlativa.entity';

@Entity('materia')
export class Materia {
  @PrimaryGeneratedColumn()
  materiaId: number;

  @Column({ length: 200 })
  nombre: string;

  @Column({ length: 20, unique: true })
  codigo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'int' })
  cargaHoraria: number;

  @Column({ type: 'int' })
  creditos: number;

  @OneToMany(() => CarreraMateria, (cm) => cm.materia)
  planEstudios: CarreraMateria[];

  @OneToMany(() => Correlativa, (c) => c.materia)
  correlativasRequeridas: Correlativa[];

  @OneToMany(() => Correlativa, (c) => c.materiaCorrelativa)
  esCorrelativaDe: Correlativa[];
}
