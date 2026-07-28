import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Carrera } from './entities/carrera.entity';
import { CarreraMateria } from './entities/carrera-materia.entity';
import { Materia } from '../materias/entities/materia.entity';
import { UsuarioCarrera } from './entities/usuario-carrera.entity';
import { ProgresoMateria } from '../progreso/entities/progreso-materia.entity';
import { MateriaPlanificada } from '../planificacion/entities/materia-planificada.entity';
import { PeriodoPlanificacion } from '../planificacion/entities/periodo-planificacion.entity';
import { Correlativa } from '../materias/entities/correlativa.entity';
import { CrearCarreraDto } from './dto/crear-carrera.dto';
import { ActualizarCarreraDto } from './dto/actualizar-carrera.dto';
import { AgregarMateriaPlanDto } from './dto/agregar-materia-plan.dto';
import { FiltrarCarrerasDto } from './dto/filtrar-carreras.dto';

export interface MateriaPlanItem {
  materiaId: number;
  carreraMateriaId: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  cargaHoraria: number;
  creditos: number;
  anio: number;
  cuatrimestre: number;
  orden: number;
  estadoUsuario: string | null;
  nota: number | null;
  tipoAprobacion: string | null;
  correlativas: {
    correlativaId: number;
    materiaId: number;
    materiaCorrelativaId: number;
    materiaCorrelativa: {
      materiaId: number;
      nombre: string;
      codigo: string;
    };
    estadoUsuario: string | null;
    nota: number | null;
    tipoAprobacion: string | null;
  }[];
  esCorrelativaDe: {
    materiaId: number;
    nombre: string;
    codigo: string;
    creditos: number;
    estadoUsuario: string | null;
    nota: number | null;
    tipoAprobacion: string | null;
  }[];
}

@Injectable()
export class CarrerasService {
  constructor(
    @InjectRepository(Carrera)
    private readonly carreraRepo: Repository<Carrera>,
    @InjectRepository(CarreraMateria)
    private readonly carreraMateriaRepo: Repository<CarreraMateria>,
    @InjectRepository(Materia)
    private readonly materiaRepo: Repository<Materia>,
    @InjectRepository(UsuarioCarrera)
    private readonly usuarioCarreraRepo: Repository<UsuarioCarrera>,
    @InjectRepository(ProgresoMateria)
    private readonly progresoRepo: Repository<ProgresoMateria>,
    @InjectRepository(MateriaPlanificada)
    private readonly materiaPlanificadaRepo: Repository<MateriaPlanificada>,
    @InjectRepository(Correlativa)
    private readonly correlativaRepo: Repository<Correlativa>,
    private readonly dataSource: DataSource,
  ) {}

  async listar(query?: FiltrarCarrerasDto): Promise<{
    data: (Carrera & { totalMaterias: number })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const qb = this.carreraRepo.createQueryBuilder('c');

    if (!query?.incluirInactivos) {
      qb.andWhere('c.activo = :activo', { activo: true });
    }

    if (query?.search) {
      qb.andWhere('c.nombre LIKE :search', { search: `%${query.search}%` });
    }

    const sortField = ['nombre', 'duracionAnios'].includes(query?.sortBy ?? '')
      ? query!.sortBy!
      : 'nombre';
    const sortBy =
      sortField === 'duracionAnios' ? 'c.duracion_anios' : 'c.nombre';
    const order = query?.sortOrder === 'DESC' ? 'DESC' : 'ASC';
    qb.orderBy(sortBy, order);

    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const total = await qb.getCount();
    const totalPages = Math.ceil(total / limit);
    const dataRaw = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const carreraIds = dataRaw.map((c) => c.carreraId);
    const conteos: Record<number, number> = {};
    if (carreraIds.length > 0) {
      const result: { carreraId: number; cnt: number }[] =
        await this.carreraMateriaRepo
          .createQueryBuilder('cm')
          .select('cm.carrera_id', 'carreraId')
          .addSelect('COUNT(*)', 'cnt')
          .where('cm.carrera_id IN (:...ids)', { ids: carreraIds })
          .groupBy('cm.carrera_id')
          .getRawMany();
      for (const r of result) {
        conteos[r.carreraId] = Number(r.cnt);
      }
    }

    const data = dataRaw.map((c) => ({
      ...c,
      totalMaterias: conteos[c.carreraId] ?? 0,
    }));

    return { data, total, page, limit, totalPages };
  }

  async obtenerDisponibles(
    usuarioId: number,
    page: number,
    limit: number,
  ): Promise<{
    data: Carrera[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const inscripciones = await this.usuarioCarreraRepo.find({
      where: { usuario: { usuarioId } },
      relations: { carrera: true },
    });
    const inscritasIds = inscripciones.map((i) => i.carrera.carreraId);

    let query = this.carreraRepo
      .createQueryBuilder('c')
      .andWhere('c.activo = :activo', { activo: true })
      .orderBy('c.nombre', 'ASC');

    if (inscritasIds.length > 0) {
      query = query.andWhere('c.carreraId NOT IN (:...ids)', {
        ids: inscritasIds,
      });
    }

    const total = await query.getCount();
    const totalPages = Math.ceil(total / limit);
    const data = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total, page, limit, totalPages };
  }

  async obtenerConPlan(id: number): Promise<Carrera> {
    const carrera = await this.carreraRepo.findOne({
      where: { carreraId: id, activo: true },
      relations: { planEstudios: { materia: true } },
    });
    if (!carrera) throw new NotFoundException('Carrera no encontrada');
    return carrera;
  }

  async obtenerPlanEstudios(
    carreraId: number,
    usuarioCarreraId?: number,
  ): Promise<{
    carrera: Carrera;
    materias: MateriaPlanItem[];
    anios: {
      anio: number;
      cuatrimestres: {
        cuatrimestre: number;
        materias: MateriaPlanItem[];
      }[];
    }[];
  }> {
    const carrera = await this.carreraRepo.findOne({
      where: { carreraId, activo: true },
    });
    if (!carrera) throw new NotFoundException('Carrera no encontrada');

    const entries = await this.carreraMateriaRepo.find({
      where: { carrera: { carreraId } },
      relations: {
        materia: {
          correlativasRequeridas: { materiaCorrelativa: true, carrera: true },
          esCorrelativaDe: { materia: true, carrera: true },
        },
      },
      order: { orden: 'ASC' },
    });

    const progresoMap = new Map<
      number,
      { estado: string; nota: number | null; tipoAprobacion: string | null }
    >();
    if (usuarioCarreraId) {
      const progresos = await this.progresoRepo.find({
        where: { usuarioCarrera: { usuarioCarreraId } },
        relations: { materia: true, estado: true },
      });
      for (const p of progresos) {
        progresoMap.set(p.materia.materiaId, {
          estado: p.estado.nombre,
          nota: p.nota,
          tipoAprobacion: p.tipoAprobacion,
        });
      }
    }

    const materias = entries.map((e) => {
      const prog = progresoMap.get(e.materia.materiaId);
      const correlativasFiltradas = (
        e.materia.correlativasRequeridas ?? []
      ).filter((c) => !c.carrera || c.carrera.carreraId === carreraId);
      const correlativasProgreso = correlativasFiltradas.map((c) => {
        const corrProg = progresoMap.get(c.materiaCorrelativa.materiaId);
        return {
          correlativaId: c.correlativaId,
          materiaId: e.materia.materiaId,
          materiaCorrelativaId: c.materiaCorrelativa.materiaId,
          materiaCorrelativa: {
            materiaId: c.materiaCorrelativa.materiaId,
            nombre: c.materiaCorrelativa.nombre,
            codigo: c.materiaCorrelativa.codigo,
          },
          estadoUsuario: corrProg?.estado ?? null,
          nota: corrProg?.nota ?? null,
          tipoAprobacion: corrProg?.tipoAprobacion ?? null,
        };
      });
      const esCorrelativaFiltradas = (e.materia.esCorrelativaDe ?? []).filter(
        (c) => !c.carrera || c.carrera.carreraId === carreraId,
      );
      const esCorrelativaDeMaterias = esCorrelativaFiltradas.map((c) => {
        const prog = progresoMap.get(c.materia.materiaId);
        return {
          materiaId: c.materia.materiaId,
          nombre: c.materia.nombre,
          codigo: c.materia.codigo,
          creditos: c.materia.creditos,
          estadoUsuario: prog?.estado ?? null,
          nota: prog?.nota ?? null,
          tipoAprobacion: prog?.tipoAprobacion ?? null,
        };
      });
      return {
        materiaId: e.materia.materiaId,
        carreraMateriaId: e.carreraMateriaId,
        nombre: e.materia.nombre,
        codigo: e.materia.codigo,
        descripcion: e.materia.descripcion,
        cargaHoraria: e.materia.cargaHoraria,
        creditos: e.materia.creditos,
        anio: e.anio,
        cuatrimestre: e.cuatrimestre,
        orden: e.orden,
        estadoUsuario: prog?.estado ?? null,
        nota: prog?.nota ?? null,
        tipoAprobacion: prog?.tipoAprobacion ?? null,
        correlativas: correlativasProgreso,
        esCorrelativaDe: esCorrelativaDeMaterias,
      };
    });

    const aniosMap = new Map<number, typeof materias>();
    for (const m of materias) {
      if (!aniosMap.has(m.anio)) aniosMap.set(m.anio, []);
      aniosMap.get(m.anio)!.push(m);
    }

    const anios = [...aniosMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([anio, lista]) => {
        const cuatrimestresMap = new Map<number, typeof materias>();
        for (const m of lista) {
          if (!cuatrimestresMap.has(m.cuatrimestre))
            cuatrimestresMap.set(m.cuatrimestre, []);
          cuatrimestresMap.get(m.cuatrimestre)!.push(m);
        }
        const cuatrimestres = [...cuatrimestresMap.entries()]
          .sort(([a], [b]) => a - b)
          .map(([cuatrimestre, mats]) => ({ cuatrimestre, materias: mats }));
        return { anio, cuatrimestres };
      });

    return { carrera, materias, anios };
  }

  async crear(dto: CrearCarreraDto): Promise<Carrera> {
    const carrera = this.carreraRepo.create(dto);
    try {
      return await this.carreraRepo.save(carrera);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as Record<string, unknown>).code === 'ER_DUP_ENTRY'
      ) {
        throw new BadRequestException('Ya existe una carrera con ese nombre');
      }
      throw error;
    }
  }

  async actualizar(id: number, dto: ActualizarCarreraDto): Promise<Carrera> {
    const carrera = await this.carreraRepo.findOne({
      where: { carreraId: id },
    });
    if (!carrera) throw new NotFoundException('Carrera no encontrada');
    Object.assign(carrera, dto);
    try {
      return await this.carreraRepo.save(carrera);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as Record<string, unknown>).code === 'ER_DUP_ENTRY'
      ) {
        throw new BadRequestException('Ya existe una carrera con ese nombre');
      }
      throw error;
    }
  }

  async eliminar(id: number): Promise<void> {
    const carrera = await this.carreraRepo.findOne({
      where: { carreraId: id },
    });
    if (!carrera) throw new NotFoundException('Carrera no encontrada');
    if (!carrera.activo)
      throw new BadRequestException('La carrera ya está inactiva');
    carrera.activo = false;
    await this.carreraRepo.save(carrera);
  }

  async restaurar(id: number): Promise<Carrera> {
    const carrera = await this.carreraRepo.findOne({
      where: { carreraId: id },
    });
    if (!carrera) throw new NotFoundException('Carrera no encontrada');
    if (carrera.activo)
      throw new BadRequestException('La carrera ya está activa');
    carrera.activo = true;
    return this.carreraRepo.save(carrera);
  }

  async agregarMateriaAlPlan(
    carreraId: number,
    dto: AgregarMateriaPlanDto,
  ): Promise<CarreraMateria> {
    const carrera = await this.carreraRepo.findOne({
      where: { carreraId, activo: true },
    });
    if (!carrera) throw new NotFoundException('Carrera no encontrada');

    const materia = await this.materiaRepo.findOne({
      where: { materiaId: dto.materiaId, activo: true },
    });
    if (!materia) throw new NotFoundException('Materia no encontrada');

    const existente = await this.carreraMateriaRepo.findOne({
      where: { carrera: { carreraId }, materia: { materiaId: dto.materiaId } },
    });
    if (existente)
      throw new BadRequestException(
        'La materia ya está en el plan de estudios',
      );

    const entry = this.carreraMateriaRepo.create({
      carrera,
      materia,
      anio: dto.anio,
      cuatrimestre: dto.cuatrimestre,
      orden: dto.orden,
    });
    return this.carreraMateriaRepo.save(entry);
  }

  async quitarMateriaDelPlan(
    carreraId: number,
    carreraMateriaId: number,
  ): Promise<void> {
    const entry = await this.carreraMateriaRepo.findOne({
      where: { carreraMateriaId, carrera: { carreraId } },
      relations: { materia: true },
    });
    if (!entry) throw new NotFoundException('Registro no encontrado');

    const materiaId = entry.materia.materiaId;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const periodos = await queryRunner.manager.find(PeriodoPlanificacion, {
        where: { usuarioCarrera: { carrera: { carreraId } } },
        select: { periodoId: true },
      });
      const periodoIds = periodos.map((p) => p.periodoId);
      if (periodoIds.length > 0) {
        await queryRunner.manager.delete(MateriaPlanificada, {
          materia: { materiaId },
          periodo: { periodoId: In(periodoIds) },
        });
      }

      const usuarioCarreras = await queryRunner.manager.find(UsuarioCarrera, {
        where: { carrera: { carreraId } },
      });
      const usuarioCarreraIds = usuarioCarreras.map(
        (uc) => uc.usuarioCarreraId,
      );
      if (usuarioCarreraIds.length > 0) {
        await queryRunner.manager.delete(ProgresoMateria, {
          materia: { materiaId },
          usuarioCarrera: { usuarioCarreraId: In(usuarioCarreraIds) },
        });
      }

      await queryRunner.manager.delete(Correlativa, {
        materia: { materiaId },
        carrera: { carreraId },
      });
      await queryRunner.manager.delete(Correlativa, {
        materiaCorrelativa: { materiaId },
        carrera: { carreraId },
      });

      await queryRunner.manager.delete(CarreraMateria, {
        carreraMateriaId,
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
