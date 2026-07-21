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

  async obtenerPorCarrera(usuarioCarreraId: number): Promise<any[]> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId },
      relations: { carrera: true },
    });
    if (!inscripcion) return [];

    const ordenPlan = await this.carreraMateriaRepo.find({
      where: { carrera: { carreraId: inscripcion.carrera.carreraId } },
      relations: { materia: true },
      order: { anio: 'ASC', cuatrimestre: 'ASC', orden: 'ASC' },
    });

    if (ordenPlan.length === 0) return [];

    const materiaIds = ordenPlan.map((cm) => cm.materia.materiaId);

    const progresos = await this.progresoRepo.find({
      where: { usuarioCarrera: { usuarioCarreraId } },
      relations: { materia: true, estado: true },
    });

    const progresoMap = new Map(progresos.map((p) => [p.materia.materiaId, p]));

    return materiaIds
      .map((id) => {
        const p = progresoMap.get(id);
        if (!p) return undefined;
        const cm = ordenPlan.find((o) => o.materia.materiaId === id);
        return {
          progresoId: p.progresoId,
          materiaId: p.materia.materiaId,
          nota: p.nota,
          tipoAprobacion: p.tipoAprobacion,
          estado: { estadoId: p.estado.estadoId, nombre: p.estado.nombre },
          materia: {
            materiaId: p.materia.materiaId,
            nombre: p.materia.nombre,
            codigo: p.materia.codigo,
            creditos: p.materia.creditos,
          },
          anio: cm?.anio ?? 0,
          cuatrimestre: cm?.cuatrimestre ?? 0,
          orden: cm?.orden ?? 0,
        };
      })
      .filter((p) => p !== undefined);
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
      relations: { materia: true, usuarioCarrera: { carrera: true } },
    });
    if (!progreso) throw new NotFoundException('Progreso no encontrado');

    const estado = await this.estadoRepo.findOne({
      where: { nombre: dto.estado },
    });
    if (!estado) throw new NotFoundException('Estado no encontrado');

    if (dto.estado === 'Completada') {
      if (dto.nota == null || !dto.tipoAprobacion) {
        throw new BadRequestException(
          'Nota y tipo de aprobación son obligatorios para completar la materia',
        );
      }
      const minNota = dto.tipoAprobacion === 'Promocion' ? 7 : 4;
      if (dto.nota < minNota || dto.nota > 10) {
        throw new BadRequestException(
          dto.tipoAprobacion === 'Promocion'
            ? 'Para Promoción la nota mínima es 7'
            : 'La nota debe estar entre 4 y 10',
        );
      }
    }

    if (dto.estado === 'En Proceso' || dto.estado === 'Completada') {
      const correlativasCumplidas = await this.validarCorrelativas(
        progreso.usuarioCarrera.usuarioCarreraId,
        progreso.materia.materiaId,
        progreso.usuarioCarrera.carrera.carreraId,
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

  async eliminar(id: number): Promise<void> {
    const progreso = await this.progresoRepo.findOne({
      where: { progresoId: id },
    });
    if (!progreso) throw new NotFoundException('Progreso no encontrado');
    await this.progresoRepo.remove(progreso);
  }

  private async validarCorrelativas(
    usuarioCarreraId: number,
    materiaId: number,
    carreraId?: number,
  ): Promise<boolean> {
    const whereClause: any = { materia: { materiaId } };
    if (carreraId) {
      whereClause.carrera = { carreraId };
    }
    const correlativas = await this.correlativaRepo.find({
      where: whereClause,
      relations: { materiaCorrelativa: true, carrera: true },
    });

    if (correlativas.length === 0) {
      if (carreraId) {
        return this.validarCorrelativas(usuarioCarreraId, materiaId);
      }
      return true;
    }

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
