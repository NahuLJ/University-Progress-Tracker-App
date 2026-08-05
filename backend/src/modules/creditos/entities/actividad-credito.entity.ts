import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
  Check,
} from 'typeorm';
import { CategoriaCredito } from './categoria-credito.entity';
import { CarreraActividadCredito } from './carrera-actividad-credito.entity';
import { ActividadRequisitoMateria } from './actividad-requisito-materia.entity';

@Entity('actividad_credito')
@Unique(['nombre', 'categoria'])
@Check('creditos > 0')
export class ActividadCredito {
  @PrimaryGeneratedColumn()
  actividadCreditoId: number;

  @ManyToOne(() => CategoriaCredito, (c) => c.actividades, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoria_credito_id' })
  categoria: CategoriaCredito;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'int' })
  creditos: number;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => CarreraActividadCredito, (ca) => ca.actividad)
  carreras: CarreraActividadCredito[];

  @OneToMany(() => ActividadRequisitoMateria, (r) => r.actividad)
  materiasRequeridas: ActividadRequisitoMateria[];
}
