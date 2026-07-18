import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeriodoPlanificacion } from './entities/periodo-planificacion.entity';
import { MateriaPlanificada } from './entities/materia-planificada.entity';
import { BloqueHorario } from './entities/bloque-horario.entity';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { Materia } from '../materias/entities/materia.entity';
import { CrearPeriodoDto } from './dto/crear-periodo.dto';
import { PlanificarMateriaDto } from './dto/planificar-materia.dto';

@Injectable()
export class PlanificacionService {
  constructor(
    @InjectRepository(PeriodoPlanificacion)
    private readonly periodoRepo: Repository<PeriodoPlanificacion>,
    @InjectRepository(MateriaPlanificada)
    private readonly materiaPlanificadaRepo: Repository<MateriaPlanificada>,
    @InjectRepository(BloqueHorario)
    private readonly bloqueRepo: Repository<BloqueHorario>,
    @InjectRepository(UsuarioCarrera)
    private readonly usuarioCarreraRepo: Repository<UsuarioCarrera>,
    @InjectRepository(Materia)
    private readonly materiaRepo: Repository<Materia>,
  ) {}

  async listarPeriodos(
    usuarioCarreraId: number,
  ): Promise<PeriodoPlanificacion[]> {
    return this.periodoRepo.find({
      where: { usuarioCarrera: { usuarioCarreraId } },
      relations: { materiasPlanificadas: { materia: true, bloque: true } },
      order: { anio: 'DESC', instancia: 'ASC' },
    });
  }

  async crearPeriodo(dto: CrearPeriodoDto): Promise<PeriodoPlanificacion> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId: dto.usuarioCarreraId },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

    const periodo = this.periodoRepo.create({
      usuarioCarrera: { usuarioCarreraId: dto.usuarioCarreraId },
      anio: dto.anio,
      instancia: dto.instancia,
      nombre: dto.nombre || undefined,
    });
    return await this.periodoRepo.save(periodo);
  }

  async eliminarPeriodo(id: number): Promise<void> {
    const periodo = await this.periodoRepo.findOne({
      where: { periodoId: id },
      relations: { materiasPlanificadas: true },
    });
    if (!periodo) throw new NotFoundException('Período no encontrado');

    await this.materiaPlanificadaRepo.remove(periodo.materiasPlanificadas);
    await this.periodoRepo.remove(periodo);
  }

  async listarBloques(): Promise<BloqueHorario[]> {
    return this.bloqueRepo.find({ order: { horaInicio: 'ASC' } });
  }

  async obtenerMateriasDelPeriodo(
    periodoId: number,
  ): Promise<MateriaPlanificada[]> {
    const periodo = await this.periodoRepo.findOne({ where: { periodoId } });
    if (!periodo) throw new NotFoundException('Período no encontrado');

    return this.materiaPlanificadaRepo.find({
      where: { periodo: { periodoId } },
      relations: { materia: true, bloque: true },
      order: { diaSemana: 'ASC', bloque: { horaInicio: 'ASC' } },
    });
  }

  async planificarMateria(
    periodoId: number,
    dto: PlanificarMateriaDto,
  ): Promise<MateriaPlanificada> {
    const periodo = await this.periodoRepo.findOne({ where: { periodoId } });
    if (!periodo) throw new NotFoundException('Período no encontrado');

    const materia = await this.materiaRepo.findOne({
      where: { materiaId: dto.materiaId },
    });
    if (!materia) throw new NotFoundException('Materia no encontrada');

    const bloque = await this.bloqueRepo.findOne({
      where: { bloqueId: dto.bloqueId },
    });
    if (!bloque) throw new NotFoundException('Bloque horario no encontrado');

    const conflicto = await this.materiaPlanificadaRepo.findOne({
      where: {
        periodo: { periodoId },
        bloque: { bloqueId: dto.bloqueId },
        diaSemana: dto.diaSemana,
      },
    });
    if (conflicto) {
      throw new BadRequestException(
        'El bloque horario ya está ocupado en ese día para este período',
      );
    }

    const yaPlanificada = await this.materiaPlanificadaRepo.findOne({
      where: {
        periodo: { periodoId },
        materia: { materiaId: dto.materiaId },
      },
    });
    if (yaPlanificada) {
      throw new BadRequestException(
        'La materia ya fue planificada en este período',
      );
    }

    const planificacion = this.materiaPlanificadaRepo.create({
      periodo,
      materia,
      bloque,
      diaSemana: dto.diaSemana,
    });
    return this.materiaPlanificadaRepo.save(planificacion);
  }

  async eliminarMateriaPlanificada(id: number): Promise<void> {
    const planificacion = await this.materiaPlanificadaRepo.findOne({
      where: { planificacionId: id },
    });
    if (!planificacion)
      throw new NotFoundException('Materia planificada no encontrada');
    await this.materiaPlanificadaRepo.remove(planificacion);
  }
}
