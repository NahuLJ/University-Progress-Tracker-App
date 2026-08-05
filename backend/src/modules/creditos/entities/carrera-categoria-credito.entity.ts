import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Check,
} from 'typeorm';
import { Carrera } from '../../carreras/entities/carrera.entity';
import { CategoriaCredito } from './categoria-credito.entity';

@Entity('carrera_categoria_credito')
@Unique(['carrera', 'categoria'])
@Check('minimo_creditos >= 0')
export class CarreraCategoriaCredito {
  @PrimaryGeneratedColumn()
  carreraCategoriaCreditoId: number;

  @ManyToOne(() => Carrera, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carrera_id' })
  carrera: Carrera;

  @ManyToOne(() => CategoriaCredito, (c) => c.carreras, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoria_credito_id' })
  categoria: CategoriaCredito;

  @Column({ name: 'minimo_creditos', type: 'int' })
  minimoCreditos: number;
}
