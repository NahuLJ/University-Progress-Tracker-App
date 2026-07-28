import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, DataSource } from 'typeorm';
import { Materia } from './entities/materia.entity';
import { Correlativa } from './entities/correlativa.entity';
import { CarreraMateria } from '../carreras/entities/carrera-materia.entity';
import { MateriaPlanificada } from '../planificacion/entities/materia-planificada.entity';
import { ProgresoMateria } from '../progreso/entities/progreso-materia.entity';
import { CrearMateriaDto } from './dto/crear-materia.dto';
import { ActualizarMateriaDto } from './dto/actualizar-materia.dto';
import { AsignarCorrelativaDto } from './dto/asignar-correlativa.dto';
import { FiltrarMateriasDto } from './dto/filtrar-materias.dto';

@Injectable()
export class MateriasService {
  constructor(
    @InjectRepository(Materia)
    private readonly materiaRepo: Repository<Materia>,
    @InjectRepository(Correlativa)
    private readonly correlativaRepo: Repository<Correlativa>,
    @InjectRepository(CarreraMateria)
    private readonly carreraMateriaRepo: Repository<CarreraMateria>,
    private readonly dataSource: DataSource,
  ) {}

  async listar(query?: FiltrarMateriasDto): Promise<{
    data: (Materia & { totalCarreras: number })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const qb = this.materiaRepo.createQueryBuilder('m');

    if (!query?.incluirInactivos) {
      qb.andWhere('m.activo = :activo', { activo: true });
    }

    if (query?.search) {
      qb.andWhere('(m.nombre LIKE :search OR m.codigo LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const sortBy = ['nombre', 'codigo', 'cargaHoraria', 'creditos'].includes(
      query?.sortBy ?? '',
    )
      ? `m.${query!.sortBy!}`
      : 'm.nombre';
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

    const materiaIds = dataRaw.map((m) => m.materiaId);
    const conteos: Record<number, number> = {};
    if (materiaIds.length > 0) {
      const result: { materiaId: number; cnt: number }[] =
        await this.carreraMateriaRepo
          .createQueryBuilder('cm')
          .select('cm.materia_id', 'materiaId')
          .addSelect('COUNT(*)', 'cnt')
          .where('cm.materia_id IN (:...ids)', { ids: materiaIds })
          .groupBy('cm.materia_id')
          .getRawMany();
      for (const r of result) {
        conteos[r.materiaId] = Number(r.cnt);
      }
    }

    const data = dataRaw.map((m) => ({
      ...m,
      totalCarreras: conteos[m.materiaId] ?? 0,
    }));

    return { data, total, page, limit, totalPages };
  }

  async obtenerConRelaciones(id: number, carreraId?: number): Promise<Materia> {
    const materia = await this.materiaRepo.findOne({
      where: { materiaId: id, activo: true },
      relations: {
        correlativasRequeridas: { materiaCorrelativa: true },
        esCorrelativaDe: { materia: true },
        planEstudios: { carrera: true },
      },
    });
    if (!materia)
      throw new NotFoundException('Materia no encontrada o desactivada');

    let correlativas = materia.correlativasRequeridas;
    if (carreraId) {
      correlativas = correlativas.filter(
        (c) => !c.carrera || c.carrera.carreraId === carreraId,
      );
      materia.esCorrelativaDe = materia.esCorrelativaDe.filter(
        (c) => !c.carrera || c.carrera.carreraId === carreraId,
      );
    }

    return {
      ...materia,
      correlativas,
    } as Materia & { correlativas: Correlativa[] };
  }

  async crear(dto: CrearMateriaDto): Promise<Materia> {
    const materia = this.materiaRepo.create(dto);
    try {
      return await this.materiaRepo.save(materia);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as Record<string, unknown>).code === 'ER_DUP_ENTRY'
      ) {
        const msg = 'Ya existe una materia con ese nombre o código';
        throw new BadRequestException(msg);
      }
      throw error;
    }
  }

  async actualizar(id: number, dto: ActualizarMateriaDto): Promise<Materia> {
    const materia = await this.materiaRepo.findOne({
      where: { materiaId: id },
    });
    if (!materia) throw new NotFoundException('Materia no encontrada');
    Object.assign(materia, dto);
    try {
      return await this.materiaRepo.save(materia);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as Record<string, unknown>).code === 'ER_DUP_ENTRY'
      ) {
        const msg = 'Ya existe una materia con ese nombre o código';
        throw new BadRequestException(msg);
      }
      throw error;
    }
  }

  async eliminar(id: number): Promise<void> {
    const materia = await this.materiaRepo.findOne({
      where: { materiaId: id },
    });
    if (!materia) throw new NotFoundException('Materia no encontrada');
    if (!materia.activo)
      throw new BadRequestException('La materia ya está inactiva');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      materia.activo = false;
      await queryRunner.manager.save(materia);

      await queryRunner.manager.delete(CarreraMateria, {
        materia: { materiaId: id },
      });

      await queryRunner.manager.delete(MateriaPlanificada, {
        materia: { materiaId: id },
      });

      await queryRunner.manager.delete(ProgresoMateria, {
        materia: { materiaId: id },
      });

      await queryRunner.manager.delete(Correlativa, {
        materia: { materiaId: id },
      });
      await queryRunner.manager.delete(Correlativa, {
        materiaCorrelativa: { materiaId: id },
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async restaurar(id: number): Promise<Materia> {
    const materia = await this.materiaRepo.findOne({
      where: { materiaId: id },
    });
    if (!materia) throw new NotFoundException('Materia no encontrada');
    if (materia.activo)
      throw new BadRequestException('La materia ya está activa');
    materia.activo = true;
    return this.materiaRepo.save(materia);
  }

  async asignarCorrelativa(
    materiaId: number,
    dto: AsignarCorrelativaDto,
  ): Promise<Correlativa> {
    if (materiaId === dto.materiaCorrelativaId) {
      throw new BadRequestException(
        'Una materia no puede ser correlativa de sí misma',
      );
    }

    const materia = await this.materiaRepo.findOne({
      where: { materiaId, activo: true },
    });
    if (!materia)
      throw new NotFoundException('Materia no encontrada o desactivada');

    const correlativa = await this.materiaRepo.findOne({
      where: { materiaId: dto.materiaCorrelativaId, activo: true },
    });
    if (!correlativa)
      throw new NotFoundException(
        'Materia correlativa no encontrada o desactivada',
      );

    if (dto.carreraId) {
      const materiaEnPlan = await this.carreraMateriaRepo.findOne({
        where: {
          carrera: { carreraId: dto.carreraId },
          materia: { materiaId },
        },
      });
      const correlativaEnPlan = await this.carreraMateriaRepo.findOne({
        where: {
          carrera: { carreraId: dto.carreraId },
          materia: { materiaId: dto.materiaCorrelativaId },
        },
      });

      if (!materiaEnPlan)
        throw new BadRequestException(
          'La materia no está en el plan de estudios de esta carrera',
        );
      if (!correlativaEnPlan)
        throw new BadRequestException(
          'La materia correlativa no está en el plan de estudios de esta carrera',
        );

      if (materiaEnPlan.anio < correlativaEnPlan.anio) {
        throw new BadRequestException(
          'La materia correlativa debe estar en un año anterior o igual',
        );
      }
      if (
        materiaEnPlan.anio === correlativaEnPlan.anio &&
        materiaEnPlan.cuatrimestre <= correlativaEnPlan.cuatrimestre
      ) {
        throw new BadRequestException(
          'La materia correlativa debe estar en un cuatrimestre anterior',
        );
      }
    }

    const whereClause: FindOptionsWhere<Correlativa> = {
      materia: { materiaId },
      materiaCorrelativa: { materiaId: dto.materiaCorrelativaId },
    };
    if (dto.carreraId) {
      whereClause.carrera = { carreraId: dto.carreraId };
    }

    const existente = await this.correlativaRepo.findOne({
      where: whereClause,
    });
    if (existente)
      throw new BadRequestException(
        'Esta correlativa ya está asignada en esta carrera',
      );

    const entry = this.correlativaRepo.create({
      materia,
      materiaCorrelativa: correlativa,
      ...(dto.carreraId ? { carrera: { carreraId: dto.carreraId } } : {}),
    });
    return this.correlativaRepo.save(entry);
  }

  async eliminarCorrelativa(
    materiaId: number,
    correlativaId: number,
  ): Promise<void> {
    const correlativa = await this.correlativaRepo.findOne({
      where: { correlativaId, materia: { materiaId } },
    });
    if (!correlativa) throw new NotFoundException('Correlativa no encontrada');
    await this.correlativaRepo.remove(correlativa);
  }
}
