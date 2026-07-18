import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PeriodoPlanificacion } from './entities/periodo-planificacion.entity';
import { MateriaPlanificada } from './entities/materia-planificada.entity';
import { BloqueHorario } from './entities/bloque-horario.entity';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { Materia } from '../materias/entities/materia.entity';
import { Correlativa } from '../materias/entities/correlativa.entity';
import { ProgresoMateria } from '../progreso/entities/progreso-materia.entity';
import { CarreraMateria } from '../carreras/entities/carrera-materia.entity';
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
    @InjectRepository(Correlativa)
    private readonly correlativaRepo: Repository<Correlativa>,
    @InjectRepository(ProgresoMateria)
    private readonly progresoRepo: Repository<ProgresoMateria>,
    @InjectRepository(CarreraMateria)
    private readonly carreraMateriaRepo: Repository<CarreraMateria>,
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
    const periodo = await this.periodoRepo.findOne({
      where: { periodoId },
      relations: { usuarioCarrera: true },
    });
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

    const correlativasCumplidas = await this.validarCorrelativas(
      periodo.usuarioCarrera.usuarioCarreraId,
      dto.materiaId,
    );
    if (!correlativasCumplidas) {
      throw new BadRequestException(
        'No se puede planificar: existen correlativas pendientes de aprobación',
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

  async obtenerMateriasDesbloqueables(periodoId: number): Promise<Materia[]> {
    const periodo = await this.periodoRepo.findOne({
      where: { periodoId },
      relations: { usuarioCarrera: { carrera: true } },
    });
    if (!periodo) throw new NotFoundException('Período no encontrado');

    const usuarioCarreraId = periodo.usuarioCarrera.usuarioCarreraId;
    const carreraId = periodo.usuarioCarrera.carrera.carreraId;

    const planificadas = await this.materiaPlanificadaRepo.find({
      where: { periodo: { periodoId } },
      relations: { materia: true },
    });
    const idsPlanificadas = new Set(
      planificadas.map((mp) => mp.materia.materiaId),
    );

    const progresos = await this.progresoRepo.find({
      where: { usuarioCarrera: { usuarioCarreraId } },
      relations: { materia: true, estado: true },
    });
    const idsCompletadas = new Set(
      progresos
        .filter((p) => p.estado.nombre === 'Completada')
        .map((p) => p.materia.materiaId),
    );

    const idsHipoteticamenteCompletadas = new Set([
      ...idsCompletadas,
      ...idsPlanificadas,
    ]);

    const planEstudios = await this.carreraMateriaRepo.find({
      where: { carrera: { carreraId } },
      relations: {
        materia: {
          correlativasRequeridas: { materiaCorrelativa: true },
        },
      },
    });

    const desbloqueables: Materia[] = [];

    for (const cm of planEstudios) {
      const materia = cm.materia;
      const materiaId = materia.materiaId;

      if (idsCompletadas.has(materiaId) || idsPlanificadas.has(materiaId)) {
        continue;
      }

      const correlativas = materia.correlativasRequeridas || [];
      if (correlativas.length === 0) continue;

      const todasCumplidas = correlativas.every((c) =>
        idsHipoteticamenteCompletadas.has(c.materiaCorrelativa.materiaId),
      );

      if (todasCumplidas) {
        desbloqueables.push(materia);
      }
    }

    return desbloqueables;
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
