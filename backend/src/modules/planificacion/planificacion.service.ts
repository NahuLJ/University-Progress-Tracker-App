import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere, IsNull } from 'typeorm';
import { PeriodoPlanificacion } from './entities/periodo-planificacion.entity';
import { MateriaPlanificada } from './entities/materia-planificada.entity';
import { BloqueHorario } from './entities/bloque-horario.entity';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { Materia } from '../materias/entities/materia.entity';
import { Correlativa } from '../materias/entities/correlativa.entity';
import { ProgresoMateria } from '../progreso/entities/progreso-materia.entity';
import { CarreraMateria } from '../carreras/entities/carrera-materia.entity';
import { Trayectoria } from '../trayectoria/entities/trayectoria.entity';
import { CrearPeriodoDto } from './dto/crear-periodo.dto';
import { ActualizarPeriodoDto } from './dto/actualizar-periodo.dto';
import { PlanificarMateriaDto } from './dto/planificar-materia.dto';

const ORDEN_INSTANCIA: Record<string, number> = {
  Verano: 0,
  '1er Cuatrimestre': 1,
  '2do Cuatrimestre': 2,
};

export interface MateriaImpactada {
  planificacionId: number;
  materiaId: number;
  nombre: string;
  codigo: string;
  periodoId: number;
  periodoNombre: string;
}

export interface NodoArbol {
  periodo: PeriodoPlanificacion | null;
  hijos: NodoArbol[];
}

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
    @InjectRepository(Trayectoria)
    private readonly trayectoriaRepo: Repository<Trayectoria>,
  ) {}

  async listarPeriodos(
    usuarioCarreraId: number,
    independientes?: boolean,
  ): Promise<PeriodoPlanificacion[]> {
    const where = independientes
      ? {
          usuarioCarrera: { usuarioCarreraId },
          trayectoriaId: IsNull(),
        }
      : {
          usuarioCarrera: { usuarioCarreraId },
        };
    return this.periodoRepo.find({
      where,
      relations: {
        materiasPlanificadas: { materia: true, bloque: true },
        trayectoria: true,
        planificacionOrigen: true,
      },
      order: { anio: 'DESC', instancia: 'ASC' },
    });
  }

  async listarPeriodosPaginado(
    usuarioCarreraId: number,
    page: number,
    limit: number,
    independientes?: boolean,
  ): Promise<{
    data: PeriodoPlanificacion[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where = independientes
      ? {
          usuarioCarrera: { usuarioCarreraId },
          trayectoriaId: IsNull(),
        }
      : {
          usuarioCarrera: { usuarioCarreraId },
        };
    const [data, total] = await this.periodoRepo.findAndCount({
      where,
      relations: {
        materiasPlanificadas: { materia: true, bloque: true },
        trayectoria: true,
        planificacionOrigen: true,
      },
      order: { anio: 'DESC', instancia: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalPages = Math.ceil(total / limit);
    return { data, total, page, limit, totalPages };
  }

  async crearPeriodo(dto: CrearPeriodoDto): Promise<PeriodoPlanificacion> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId: dto.usuarioCarreraId },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

    if (dto.trayectoriaId !== undefined) {
      const trayectoria = await this.trayectoriaRepo.findOne({
        where: { trayectoriaId: dto.trayectoriaId },
      });
      if (!trayectoria) {
        throw new NotFoundException('Trayectoria no encontrada');
      }
      if (trayectoria.usuarioCarreraId !== dto.usuarioCarreraId) {
        throw new BadRequestException(
          'La trayectoria no pertenece a esta inscripción',
        );
      }

      await this.validarOrdenCronologico(
        dto.trayectoriaId,
        dto.anio,
        dto.instancia,
        dto.planificacionOrigenId,
      );

      if (dto.planificacionOrigenId !== undefined) {
        const origen = await this.periodoRepo.findOne({
          where: { periodoId: dto.planificacionOrigenId },
        });
        if (!origen) {
          throw new NotFoundException('Planificación origen no encontrada');
        }
        if (origen.trayectoriaId !== dto.trayectoriaId) {
          throw new BadRequestException(
            'La planificación origen no pertenece a esta trayectoria',
          );
        }
      }
    } else if (dto.planificacionOrigenId !== undefined) {
      throw new BadRequestException(
        'Una planificación con origen debe pertenecer a una trayectoria',
      );
    }

    const periodo = new PeriodoPlanificacion();
    periodo.usuarioCarrera = inscripcion;
    periodo.trayectoriaId = dto.trayectoriaId ?? null;
    periodo.planificacionOrigenId = dto.planificacionOrigenId ?? null;
    periodo.anio = dto.anio;
    periodo.instancia = dto.instancia;
    periodo.nombre = dto.nombre;

    return this.periodoRepo.save(periodo);
  }

  async actualizarPeriodo(
    id: number,
    dto: ActualizarPeriodoDto,
  ): Promise<PeriodoPlanificacion> {
    const periodo = await this.periodoRepo.findOne({
      where: { periodoId: id },
      relations: { materiasPlanificadas: { materia: true, bloque: true } },
    });
    if (!periodo) throw new NotFoundException('Período no encontrado');

    if (dto.anio !== undefined) periodo.anio = dto.anio;
    if (dto.instancia !== undefined) periodo.instancia = dto.instancia;
    if (dto.nombre !== undefined) periodo.nombre = dto.nombre;

    return this.periodoRepo.save(periodo);
  }

  async eliminarPeriodo(id: number): Promise<void> {
    const periodo = await this.periodoRepo.findOne({
      where: { periodoId: id },
      relations: { materiasPlanificadas: true },
    });
    if (!periodo) throw new NotFoundException('Período no encontrado');

    await this.eliminarDescendientes(id);

    await this.materiaPlanificadaRepo.remove(periodo.materiasPlanificadas);
    await this.periodoRepo.remove(periodo);
  }

  private async eliminarDescendientes(periodoId: number): Promise<void> {
    const hijos = await this.periodoRepo.find({
      where: { planificacionOrigenId: periodoId },
      relations: { materiasPlanificadas: true },
    });

    for (const hijo of hijos) {
      await this.eliminarDescendientes(hijo.periodoId);
      await this.materiaPlanificadaRepo.remove(hijo.materiasPlanificadas);
      await this.periodoRepo.remove(hijo);
    }
  }

  async listarBloques(): Promise<BloqueHorario[]> {
    return this.bloqueRepo.find({ order: { horaInicio: 'ASC' } });
  }

  async obtenerMateriasDelPeriodo(
    periodoId: number,
  ): Promise<MateriaPlanificada[]> {
    const periodo = await this.periodoRepo.findOne({ where: { periodoId } });
    if (!periodo) return [];

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
      relations: { usuarioCarrera: { carrera: true } },
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

    const bloquesAsignados = await this.materiaPlanificadaRepo.count({
      where: {
        periodo: { periodoId },
        materia: { materiaId: dto.materiaId },
      },
    });
    const maxBloques = Math.ceil(materia.cargaHoraria / 2);
    if (bloquesAsignados + 1 > maxBloques) {
      throw new BadRequestException(
        'La materia ya tiene todas sus horas planificadas en este período',
      );
    }

    const disponibles = await this.obtenerMateriasDisponibles(
      periodo.usuarioCarrera.usuarioCarreraId,
      periodo.trayectoriaId ?? undefined,
      periodo.periodoId,
    );
    const materiaDisponible = disponibles.some(
      (m) => m.materiaId === dto.materiaId,
    );
    if (!materiaDisponible) {
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

  async obtenerMateriasDisponibles(
    usuarioCarreraId: number,
    trayectoriaId?: number,
    periodoId?: number,
  ): Promise<Materia[]> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId },
      relations: { carrera: true },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

    const planEstudios = await this.carreraMateriaRepo.find({
      where: { carrera: { carreraId: inscripcion.carrera.carreraId } },
      relations: {
        materia: {
          correlativasRequeridas: { materiaCorrelativa: true, carrera: true },
        },
      },
      order: { orden: 'ASC' },
    });

    const progresos = await this.progresoRepo.find({
      where: { usuarioCarrera: { usuarioCarreraId } },
      relations: { materia: true, estado: true },
    });

    const idsCompletadas = new Set(
      progresos
        .filter((p) => p.estado.nombre === 'Completada')
        .map((p) => p.materia.materiaId),
    );

    const idsPlanificadasPrevias = new Set<number>();
    const idsPlanificadasEnTrayectoria = new Set<number>();

    if (trayectoriaId !== undefined && periodoId !== undefined) {
      const periodoActual = await this.periodoRepo.findOne({
        where: { periodoId },
      });
      if (periodoActual) {
        const periodosEnTrayectoria = await this.periodoRepo.find({
          where: { trayectoriaId },
          relations: { materiasPlanificadas: { materia: true } },
        });

        const periodosMap = new Map<number, PeriodoPlanificacion>();
        for (const p of periodosEnTrayectoria) {
          periodosMap.set(p.periodoId, p);
        }

        let current: PeriodoPlanificacion | null = periodoActual;
        while (current.planificacionOrigenId) {
          const ancestro = periodosMap.get(current.planificacionOrigenId);
          if (!ancestro) break;
          for (const mp of ancestro.materiasPlanificadas) {
            idsPlanificadasEnTrayectoria.add(mp.materia.materiaId);
            idsPlanificadasPrevias.add(mp.materia.materiaId);
          }
          current = ancestro;
        }
      }
    }

    const idsCumplidos = new Set([
      ...idsCompletadas,
      ...idsPlanificadasPrevias,
    ]);

    const disponibles: Materia[] = [];

    for (const cm of planEstudios) {
      const materia = cm.materia;
      const materiaId = materia.materiaId;

      if (idsCompletadas.has(materiaId)) continue;
      if (idsPlanificadasEnTrayectoria.has(materiaId)) continue;

      const correlativas = (materia.correlativasRequeridas || []).filter(
        (c) =>
          !c.carrera || c.carrera.carreraId === inscripcion.carrera.carreraId,
      );

      if (correlativas.length === 0) {
        disponibles.push(materia);
        continue;
      }

      const todasCumplidas = correlativas.every((c) =>
        idsCumplidos.has(c.materiaCorrelativa.materiaId),
      );

      if (todasCumplidas) {
        disponibles.push(materia);
      }
    }

    return disponibles;
  }

  async obtenerMateriasDesbloqueables(
    periodoId: number,
    materiaIds?: number[],
  ): Promise<Materia[]> {
    const periodo = await this.periodoRepo.findOne({
      where: { periodoId },
      relations: { usuarioCarrera: { carrera: true } },
    });
    if (!periodo) return [];

    const usuarioCarreraId = periodo.usuarioCarrera.usuarioCarreraId;
    const carreraId = periodo.usuarioCarrera.carrera.carreraId;

    let idsPlanificadas: Set<number>;
    if (materiaIds !== undefined) {
      idsPlanificadas = new Set(materiaIds);
    } else {
      const planificadas = await this.materiaPlanificadaRepo.find({
        where: { periodo: { periodoId } },
        relations: { materia: true },
      });
      idsPlanificadas = new Set(planificadas.map((mp) => mp.materia.materiaId));
    }

    const progresos = await this.progresoRepo.find({
      where: { usuarioCarrera: { usuarioCarreraId } },
      relations: { materia: true, estado: true },
    });
    const idsCompletadas = new Set(
      progresos
        .filter((p) => p.estado.nombre === 'Completada')
        .map((p) => p.materia.materiaId),
    );

    const idsPlanificadasPrevias = new Set<number>();

    if (periodo.trayectoriaId) {
      const periodosEnTrayectoria = await this.periodoRepo.find({
        where: { trayectoriaId: periodo.trayectoriaId },
        relations: { materiasPlanificadas: { materia: true } },
      });

      const periodosMap = new Map<number, PeriodoPlanificacion>();
      for (const p of periodosEnTrayectoria) {
        periodosMap.set(p.periodoId, p);
      }

      let current: PeriodoPlanificacion | null = periodo;
      while (current.planificacionOrigenId) {
        const ancestro = periodosMap.get(current.planificacionOrigenId);
        if (!ancestro) break;
        for (const mp of ancestro.materiasPlanificadas) {
          idsPlanificadasPrevias.add(mp.materia.materiaId);
        }
        current = ancestro;
      }
    }

    const idsHipoteticamenteCompletadas = new Set([
      ...idsCompletadas,
      ...idsPlanificadas,
      ...idsPlanificadasPrevias,
    ]);

    const planEstudios = await this.carreraMateriaRepo.find({
      where: { carrera: { carreraId } },
      relations: {
        materia: {
          correlativasRequeridas: { materiaCorrelativa: true, carrera: true },
        },
      },
    });

    const desbloqueables: Materia[] = [];

    for (const cm of planEstudios) {
      const materia = cm.materia;
      const materiaId = materia.materiaId;

      if (
        idsCompletadas.has(materiaId) ||
        idsPlanificadas.has(materiaId) ||
        idsPlanificadasPrevias.has(materiaId)
      ) {
        continue;
      }

      const correlativas = (materia.correlativasRequeridas || []).filter(
        (c) => !c.carrera || c.carrera.carreraId === carreraId,
      );
      if (correlativas.length === 0) continue;

      const todasCumplidas = correlativas.every((c) =>
        idsHipoteticamenteCompletadas.has(c.materiaCorrelativa.materiaId),
      );
      const yaDisponibleSinPlanificar = correlativas.every((c) =>
        idsCompletadas.has(c.materiaCorrelativa.materiaId),
      );

      if (todasCumplidas && !yaDisponibleSinPlanificar) {
        desbloqueables.push(materia);
      }
    }

    return desbloqueables;
  }

  async obtenerImpactoEliminacion(
    materiaPlanificadaId: number,
  ): Promise<MateriaImpactada[]> {
    const mp = await this.materiaPlanificadaRepo.findOne({
      where: { planificacionId: materiaPlanificadaId },
      relations: {
        materia: true,
        periodo: { trayectoria: true },
      },
    });
    if (!mp) {
      throw new NotFoundException('Materia planificada no encontrada');
    }

    const periodo = mp.periodo;
    if (!periodo.trayectoriaId) return [];

    const materiaRemovidaId = mp.materia.materiaId;
    const usuarioCarreraId = await this.obtenerUsuarioCarreraId(
      periodo.periodoId,
    );

    const todasLasPlanificaciones = await this.periodoRepo.find({
      where: { trayectoriaId: periodo.trayectoriaId },
      relations: {
        materiasPlanificadas: { materia: true },
        planificacionOrigen: true,
      },
    });

    const mapaPeriodos = new Map(
      todasLasPlanificaciones.map((p) => [p.periodoId, p]),
    );

    const hijos = this.obtenerDescendientes(
      periodo.periodoId,
      mapaPeriodos,
      new Set(),
    );

    if (hijos.length === 0) return [];

    const progresos = await this.progresoRepo.find({
      where: { usuarioCarrera: { usuarioCarreraId } },
      relations: { materia: true, estado: true },
    });
    const idsCompletadas = new Set(
      progresos
        .filter((p) => p.estado.nombre === 'Completada')
        .map((p) => p.materia.materiaId),
    );

    const impactadas: MateriaImpactada[] = [];

    for (const hijo of hijos) {
      const planificadasPreviasHijo = await this.obtenerPlanificadasPrevias(
        hijo.periodoId,
        idsCompletadas,
      );

      const idsPreviosSinRemovida = new Set(
        [...planificadasPreviasHijo].filter((id) => id !== materiaRemovidaId),
      );

      for (const mpHijo of hijo.materiasPlanificadas) {
        const correlativas = await this.correlativaRepo.find({
          where: { materia: { materiaId: mpHijo.materia.materiaId } },
          relations: { materiaCorrelativa: true, carrera: true },
        });

        if (correlativas.length === 0) continue;

        const necesitaRemovida = correlativas.some(
          (c) => c.materiaCorrelativa.materiaId === materiaRemovidaId,
        );
        if (!necesitaRemovida) continue;

        const seSigueCumpliendo = correlativas.every((c) => {
          const corrId = c.materiaCorrelativa.materiaId;
          return (
            idsCompletadas.has(corrId) ||
            idsPreviosSinRemovida.has(corrId) ||
            corrId === mpHijo.materia.materiaId
          );
        });

        if (!seSigueCumpliendo) {
          impactadas.push({
            planificacionId: mpHijo.planificacionId,
            materiaId: mpHijo.materia.materiaId,
            nombre: mpHijo.materia.nombre,
            codigo: mpHijo.materia.codigo,
            periodoId: hijo.periodoId,
            periodoNombre: hijo.nombre || `${hijo.instancia} ${hijo.anio}`,
          });
        }
      }
    }

    return impactadas;
  }

  async eliminarMateriaPlanificada(
    id: number,
    modo: 'simple' | 'cascade' = 'simple',
  ): Promise<{ eliminadas: number[]; impactadas: MateriaImpactada[] }> {
    const mp = await this.materiaPlanificadaRepo.findOne({
      where: { planificacionId: id },
      relations: {
        materia: true,
        periodo: { trayectoria: true, planificacionOrigen: true },
      },
    });
    if (!mp) {
      throw new NotFoundException('Materia planificada no encontrada');
    }

    if (modo === 'cascade' && mp.periodo.trayectoriaId) {
      const impactadas = await this.obtenerImpactoEliminacion(id);

      for (const imp of impactadas) {
        await this.eliminarRecursivo(imp.materiaId, mp.periodo.periodoId);
      }

      await this.materiaPlanificadaRepo.remove(mp);

      const eliminadas = [id, ...impactadas.map((i) => i.planificacionId)];
      return { eliminadas, impactadas };
    }

    await this.materiaPlanificadaRepo.remove(mp);
    return { eliminadas: [id], impactadas: [] };
  }

  private async eliminarRecursivo(
    materiaId: number,
    periodoOrigenId: number,
    visitados: Set<number> = new Set(),
  ): Promise<void> {
    const periodoOrigen = await this.periodoRepo.findOne({
      where: { periodoId: periodoOrigenId },
    });
    if (!periodoOrigen || !periodoOrigen.trayectoriaId) return;

    const hijos = await this.periodoRepo.find({
      where: { planificacionOrigenId: periodoOrigenId },
      relations: { materiasPlanificadas: { materia: true } },
    });

    for (const hijo of hijos) {
      if (visitados.has(hijo.periodoId)) continue;
      visitados.add(hijo.periodoId);

      for (const mpHijo of hijo.materiasPlanificadas) {
        if (mpHijo.materia.materiaId === materiaId) {
          await this.materiaPlanificadaRepo.remove(mpHijo);
        } else {
          const mpCorrelativas = await this.correlativaRepo.find({
            where: { materia: { materiaId: mpHijo.materia.materiaId } },
            relations: { materiaCorrelativa: true },
          });
          const necesita = mpCorrelativas.some(
            (c) => c.materiaCorrelativa.materiaId === materiaId,
          );
          if (necesita) {
            await this.eliminarRecursivo(
              mpHijo.materia.materiaId,
              hijo.periodoId,
              visitados,
            );
          }
        }
      }
    }
  }

  async verificarInconsistencias(
    periodoId: number,
  ): Promise<MateriaImpactada[]> {
    const periodo = await this.periodoRepo.findOne({
      where: { periodoId },
      relations: { usuarioCarrera: true },
    });
    if (!periodo) throw new NotFoundException('Período no encontrado');
    if (!periodo.trayectoriaId) return [];

    const usuarioCarreraId = periodo.usuarioCarrera
      ? periodo.usuarioCarrera.usuarioCarreraId
      : await this.obtenerUsuarioCarreraId(periodoId);

    const planificadas = await this.materiaPlanificadaRepo.find({
      where: { periodo: { periodoId } },
      relations: { materia: true },
    });

    const progresos = await this.progresoRepo.find({
      where: { usuarioCarrera: { usuarioCarreraId } },
      relations: { materia: true, estado: true },
    });
    const idsCompletadas = new Set(
      progresos
        .filter((p) => p.estado.nombre === 'Completada')
        .map((p) => p.materia.materiaId),
    );

    const planificadasPrevias = await this.obtenerPlanificadasPrevias(
      periodoId,
      idsCompletadas,
    );

    const inconsistentes: MateriaImpactada[] = [];

    for (const mp of planificadas) {
      const correlativas = await this.correlativaRepo.find({
        where: { materia: { materiaId: mp.materia.materiaId } },
        relations: { materiaCorrelativa: true },
      });

      if (correlativas.length === 0) continue;

      const todasCumplidas = correlativas.every(
        (c) =>
          idsCompletadas.has(c.materiaCorrelativa.materiaId) ||
          planificadasPrevias.has(c.materiaCorrelativa.materiaId),
      );

      if (!todasCumplidas) {
        inconsistentes.push({
          planificacionId: mp.planificacionId,
          materiaId: mp.materia.materiaId,
          nombre: mp.materia.nombre,
          codigo: mp.materia.codigo,
          periodoId,
          periodoNombre:
            periodo.nombre || `${periodo.instancia} ${periodo.anio}`,
        });
      }
    }

    return inconsistentes;
  }

  private obtenerDescendientes(
    periodoId: number,
    mapa: Map<number, PeriodoPlanificacion>,
    visitados: Set<number>,
  ): PeriodoPlanificacion[] {
    const result: PeriodoPlanificacion[] = [];
    for (const [, p] of mapa) {
      if (
        p.planificacionOrigenId === periodoId &&
        !visitados.has(p.periodoId)
      ) {
        visitados.add(p.periodoId);
        result.push(p);
        result.push(...this.obtenerDescendientes(p.periodoId, mapa, visitados));
      }
    }
    return result;
  }

  private async obtenerPlanificadasPrevias(
    periodoId: number,
    idsCompletadas: Set<number>,
  ): Promise<Set<number>> {
    const ids = new Set<number>();

    const actual = await this.periodoRepo.findOne({
      where: { periodoId },
    });
    if (!actual || !actual.trayectoriaId) return ids;

    const todos = await this.periodoRepo.find({
      where: { trayectoriaId: actual.trayectoriaId },
      relations: { materiasPlanificadas: { materia: true } },
    });

    const periodosMap = new Map<number, PeriodoPlanificacion>();
    for (const p of todos) {
      periodosMap.set(p.periodoId, p);
    }

    let current: PeriodoPlanificacion | null = actual;
    while (current.planificacionOrigenId) {
      const ancestro = periodosMap.get(current.planificacionOrigenId);
      if (!ancestro) break;
      for (const mp of ancestro.materiasPlanificadas) {
        if (!idsCompletadas.has(mp.materia.materiaId)) {
          ids.add(mp.materia.materiaId);
        }
      }
      current = ancestro;
    }
    return ids;
  }

  private async obtenerUsuarioCarreraId(periodoId: number): Promise<number> {
    const p = await this.periodoRepo.findOne({
      where: { periodoId },
      relations: { usuarioCarrera: true },
    });
    return p?.usuarioCarrera?.usuarioCarreraId ?? 0;
  }

  private async validarOrdenCronologico(
    trayectoriaId: number,
    anio: number,
    instancia: string,
    planificacionOrigenId?: number,
  ): Promise<void> {
    const anteriores = await this.periodoRepo.find({
      where: { trayectoriaId },
      order: { anio: 'DESC', instancia: 'DESC' },
    });

    const instanciaNum = ORDEN_INSTANCIA[instancia] ?? -1;

    if (planificacionOrigenId !== undefined) {
      const origen = anteriores.find(
        (p) => p.periodoId === planificacionOrigenId,
      );
      if (!origen) return;
      const origenInstanciaNum = ORDEN_INSTANCIA[origen.instancia] ?? -1;
      if (
        anio < origen.anio ||
        (anio === origen.anio && instanciaNum <= origenInstanciaNum)
      ) {
        throw new ConflictException(
          'El nuevo período debe ser cronológicamente posterior al período origen.',
        );
      }
      return;
    }

    for (const p of anteriores) {
      const pInstanciaNum = ORDEN_INSTANCIA[p.instancia] ?? -1;
      if (p.anio > anio || (p.anio === anio && pInstanciaNum >= instanciaNum)) {
        throw new ConflictException(
          'Ya existe una planificación posterior o igual en esta trayectoria. El nuevo período debe ser cronológicamente posterior.',
        );
      }
    }
  }

  private async validarCorrelativas(
    usuarioCarreraId: number,
    materiaId: number,
    carreraId?: number,
    trayectoriaId?: number,
    periodoId?: number,
  ): Promise<boolean> {
    const whereClause: FindOptionsWhere<Correlativa> = {
      materia: { materiaId },
    };
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
      relations: { estado: true, materia: true },
    });

    const completadas = progresos.filter(
      (p) => p.estado.nombre === 'Completada',
    );
    if (completadas.length === correlativas.length) return true;

    if (trayectoriaId !== undefined && periodoId !== undefined) {
      const idsCompletadas = new Set(
        completadas.map((p) => p.materia.materiaId),
      );

      const idsPlanificadasPrevias = await this.obtenerPlanificadasPrevias(
        periodoId,
        idsCompletadas,
      );

      const idsCumplidos = new Set([
        ...idsCompletadas,
        ...idsPlanificadasPrevias,
      ]);

      return idsCorrelativas.every((id) => idsCumplidos.has(id));
    }

    return completadas.length === correlativas.length;
  }
}
