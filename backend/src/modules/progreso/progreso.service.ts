import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProgresoMateria } from './entities/progreso-materia.entity';
import { EstadoMateria } from './entities/estado-materia.entity';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { CarreraMateria } from '../carreras/entities/carrera-materia.entity';
import { Correlativa } from '../materias/entities/correlativa.entity';
import { ActualizarProgresoDto } from './dto/actualizar-progreso.dto';

@Injectable()
export class ProgresoService {
  constructor(
    @InjectRepository(ProgresoMateria)
    private readonly progresoRepo: Repository<ProgresoMateria>,
    @InjectRepository(UsuarioCarrera)
    private readonly usuarioCarreraRepo: Repository<UsuarioCarrera>,
    @InjectRepository(CarreraMateria)
    private readonly carreraMateriaRepo: Repository<CarreraMateria>,
    @InjectRepository(Correlativa)
    private readonly correlativaRepo: Repository<Correlativa>,
    @InjectRepository(EstadoMateria)
    private readonly estadoRepo: Repository<EstadoMateria>,
  ) {}

  async obtenerPorCarrera(
    usuarioCarreraId: number,
  ): Promise<ProgresoMateria[]> {
    return this.progresoRepo.find({
      where: { usuarioCarrera: { usuarioCarreraId } },
      relations: { materia: true, estado: true },
      order: { materia: { nombre: 'ASC' } },
    });
  }

  async obtenerPorId(id: number): Promise<ProgresoMateria> {
    const progreso = await this.progresoRepo.findOne({
      where: { progresoId: id },
      relations: { materia: true, estado: true },
    });
    if (!progreso) throw new NotFoundException('Progreso no encontrado');
    return progreso;
  }

  async inicializar(dto: {
    usuarioCarreraId: number;
  }): Promise<{ creados: number; existentes: number }> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId: dto.usuarioCarreraId },
      relations: { carrera: true },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

    const planCompleto = await this.carreraMateriaRepo.find({
      where: { carrera: { carreraId: inscripcion.carrera.carreraId } },
      relations: { materia: true },
    });

    const estadoPendiente = await this.estadoRepo.findOne({
      where: { nombre: 'Pendiente' },
    });
    let creados = 0;
    let existentes = 0;

    for (const entry of planCompleto) {
      const yaExiste = await this.progresoRepo.findOne({
        where: {
          usuarioCarrera: { usuarioCarreraId: dto.usuarioCarreraId },
          materia: { materiaId: entry.materia.materiaId },
        },
      });
      if (yaExiste) {
        existentes++;
        continue;
      }
      const nuevo = this.progresoRepo.create({
        usuarioCarrera: { usuarioCarreraId: dto.usuarioCarreraId },
        materia: { materiaId: entry.materia.materiaId },
        estado: estadoPendiente!,
      });
      await this.progresoRepo.save(nuevo);
      creados++;
    }
    return { creados, existentes };
  }

  async actualizar(
    id: number,
    dto: ActualizarProgresoDto,
  ): Promise<ProgresoMateria> {
    const progreso = await this.progresoRepo.findOne({
      where: { progresoId: id },
      relations: { materia: true, usuarioCarrera: true },
    });
    if (!progreso) throw new NotFoundException('Progreso no encontrado');

    const estado = await this.estadoRepo.findOne({
      where: { nombre: dto.estado },
    });
    if (!estado) throw new NotFoundException('Estado no encontrado');

    if (dto.estado === 'En Proceso' || dto.estado === 'Completada') {
      const correlativasCumplidas = await this.validarCorrelativas(
        progreso.usuarioCarrera.usuarioCarreraId,
        progreso.materia.materiaId,
      );
      if (!correlativasCumplidas) {
        throw new BadRequestException(
          'No se puede avanzar: existen correlativas pendientes de aprobación',
        );
      }
    }

    progreso.estado = estado;

    if (dto.estado === 'Completada') {
      progreso.nota = dto.nota ?? null;
      progreso.tipoAprobacion = dto.tipoAprobacion ?? null;
      progreso.fechaCompletado = new Date().toISOString().split('T')[0];
    } else {
      progreso.nota = null;
      progreso.tipoAprobacion = null;
      progreso.fechaCompletado = null;
    }

    return this.progresoRepo.save(progreso);
  }

  private async validarCorrelativas(
    usuarioCarreraId: number,
    materiaId: number,
  ): Promise<boolean> {
    const correlativas = await this.correlativaRepo.find({
      where: { materia: { materiaId } },
      relations: { materiaCorrelativa: true },
    });

    if (correlativas.length === 0) return true;

    const idsCorrelativas = correlativas.map(
      (c) => c.materiaCorrelativa.materiaId,
    );

    const progresos = await this.progresoRepo.find({
      where: {
        usuarioCarrera: { usuarioCarreraId },
        materia: { materiaId: In(idsCorrelativas) },
      },
      relations: { estado: true },
    });

    const completadas = progresos.filter(
      (p) => p.estado.nombre === 'Completada',
    );
    return completadas.length === correlativas.length;
  }
}
