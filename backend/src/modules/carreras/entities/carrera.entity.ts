import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UsuarioCarrera } from './usuario-carrera.entity';
import { CarreraMateria } from './carrera-materia.entity';

@Entity('carrera')
export class Carrera {
  @PrimaryGeneratedColumn()
  carreraId: number;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'duracion_anios', type: 'decimal', precision: 3, scale: 1 })
  duracionAnios: number;

  @OneToMany(() => UsuarioCarrera, (uc) => uc.carrera)
  usuarioCarreras: UsuarioCarrera[];

  @OneToMany(() => CarreraMateria, (cm) => cm.carrera)
  planEstudios: CarreraMateria[];
}
