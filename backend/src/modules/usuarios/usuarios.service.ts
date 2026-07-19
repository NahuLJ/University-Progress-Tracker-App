import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { Carrera } from '../carreras/entities/carrera.entity';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { InscribirCarreraDto } from './dto/inscribir-carrera.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(UsuarioCarrera)
    private readonly usuarioCarreraRepo: Repository<UsuarioCarrera>,
    @InjectRepository(Carrera)
    private readonly carreraRepo: Repository<Carrera>,
  ) {}

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.usuarioRepo.findOne({ where: { email } });
  }

  async crear(dto: CrearUsuarioDto): Promise<Usuario> {
    const usuario = this.usuarioRepo.create(dto);
    return this.usuarioRepo.save(usuario);
  }

  async obtenerPerfil(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepo.findOne({
      where: { usuarioId: id },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async actualizarPerfil(
    id: number,
    dto: ActualizarUsuarioDto,
  ): Promise<Usuario> {
    const usuario = await this.obtenerPerfil(id);
    Object.assign(usuario, dto);
    return this.usuarioRepo.save(usuario);
  }

  async obtenerCarreras(id: number): Promise<UsuarioCarrera[]> {
    return this.usuarioCarreraRepo.find({
      where: { usuario: { usuarioId: id } },
      relations: { carrera: true },
      order: { fechaInicio: 'DESC' as const },
    });
  }

  async obtenerCarrerasActivas(id: number): Promise<UsuarioCarrera[]> {
    return this.usuarioCarreraRepo.find({
      where: { usuario: { usuarioId: id }, activo: true },
      relations: { carrera: true },
      order: { fechaInicio: 'DESC' as const },
    });
  }

  async inscribirCarrera(
    usuarioId: number,
    dto: InscribirCarreraDto,
  ): Promise<UsuarioCarrera> {
    const carrera = await this.carreraRepo.findOne({
      where: { carreraId: dto.carreraId },
    });
    if (!carrera) throw new NotFoundException('Carrera no encontrada');

    const existente = await this.usuarioCarreraRepo.findOne({
      where: {
        usuario: { usuarioId },
        carrera: { carreraId: dto.carreraId },
        activo: true,
      },
    });
    if (existente)
      throw new BadRequestException('Ya estás inscripto en esta carrera');

    const inscripcion = this.usuarioCarreraRepo.create({
      usuario: { usuarioId },
      carrera,
      fechaInicio: dto.fechaInicio,
      activo: true,
    });
    return this.usuarioCarreraRepo.save(inscripcion);
  }

  async desactivarCarrera(
    usuarioId: number,
    usuarioCarreraId: number,
  ): Promise<void> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId, usuario: { usuarioId } },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');
    inscripcion.activo = false;
    await this.usuarioCarreraRepo.save(inscripcion);
  }

  async reactivarCarrera(
    usuarioId: number,
    usuarioCarreraId: number,
  ): Promise<UsuarioCarrera> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId, usuario: { usuarioId } },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');
    if (inscripcion.activo)
      throw new BadRequestException('La inscripción ya está activa');
    inscripcion.activo = true;
    return this.usuarioCarreraRepo.save(inscripcion);
  }

  async eliminarCarreraDefinitivamente(
    usuarioId: number,
    usuarioCarreraId: number,
  ): Promise<void> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId, usuario: { usuarioId } },
      relations: { progresos: true, periodos: { materiasPlanificadas: true } },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

    if (inscripcion.progresos?.length) {
      await this.usuarioCarreraRepo.manager.remove(inscripcion.progresos);
    }
    if (inscripcion.periodos?.length) {
      for (const periodo of inscripcion.periodos) {
        if (periodo.materiasPlanificadas?.length) {
          await this.usuarioCarreraRepo.manager.remove(periodo.materiasPlanificadas);
        }
      }
      await this.usuarioCarreraRepo.manager.remove(inscripcion.periodos);
    }

    await this.usuarioCarreraRepo.remove(inscripcion);
  }
}
