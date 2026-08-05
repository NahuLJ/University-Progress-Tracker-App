import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
} from 'typeorm';
import { ActividadCredito } from './actividad-credito.entity';
import { CarreraCategoriaCredito } from './carrera-categoria-credito.entity';

@Entity('categoria_credito')
@Unique(['nombre'])
export class CategoriaCredito {
  @PrimaryGeneratedColumn()
  categoriaCreditoId: number;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => ActividadCredito, (a) => a.categoria)
  actividades: ActividadCredito[];

  @OneToMany(() => CarreraCategoriaCredito, (cc) => cc.categoria)
  carreras: CarreraCategoriaCredito[];
}
