import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UsuarioCarrera } from '../../carreras/entities/usuario-carrera.entity';
import { ProgresoMateria } from '../../progreso/entities/progreso-materia.entity';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  usuarioId: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ length: 200, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({
    name: 'fecha_registro',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaRegistro: Date;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => UsuarioCarrera, (uc) => uc.usuario)
  usuarioCarreras: UsuarioCarrera[];

  @OneToMany(() => ProgresoMateria, (pm) => pm.usuario)
  progresos: ProgresoMateria[];
}
