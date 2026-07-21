import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Materia } from './entities/materia.entity';
import { Correlativa } from './entities/correlativa.entity';
import { Carrera } from '../carreras/entities/carrera.entity';
import { CrearMateriaDto } from './dto/crear-materia.dto';
import { AsignarCorrelativaDto } from './dto/asignar-correlativa.dto';

@Injectable()
export class MateriasService {
  constructor(
    @InjectRepository(Materia)
    private readonly materiaRepo: Repository<Materia>,
    @InjectRepository(Correlativa)
    private readonly correlativaRepo: Repository<Correlativa>,
  ) {}

  async listar(): Promise<Materia[]> {
    return this.materiaRepo.find({ order: { nombre: 'ASC' } });
  }

    async obtenerConRelaciones(id: number, carreraId?: number): Promise<Materia> {
        const materia = await this.materiaRepo.findOne({
            where: { materiaId: id },
            relations: {
                correlativasRequeridas: { materiaCorrelativa: true },
                esCorrelativaDe: { materia: true },
                planEstudios: { carrera: true },
            },
        });
        if (!materia) throw new NotFoundException('Materia no encontrada');

        if (carreraId) {
            materia.correlativasRequeridas = materia.correlativasRequeridas.filter(
                (c) => !c.carrera || c.carrera.carreraId === carreraId,
            );
            materia.esCorrelativaDe = materia.esCorrelativaDe.filter(
                (c) => !c.carrera || c.carrera.carreraId === carreraId,
            );
        }

        return materia;
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
        throw new BadRequestException('El código de materia ya existe');
      }
      throw error;
    }
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

    const materia = await this.materiaRepo.findOne({ where: { materiaId } });
    if (!materia) throw new NotFoundException('Materia no encontrada');

    const correlativa = await this.materiaRepo.findOne({
      where: { materiaId: dto.materiaCorrelativaId },
    });
    if (!correlativa)
      throw new NotFoundException('Materia correlativa no encontrada');

    const whereClause: any = {
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
      throw new BadRequestException('Esta correlativa ya está asignada en esta carrera');

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
    carreraId?: number,
  ): Promise<void> {
    const whereClause: any = { correlativaId, materia: { materiaId } };
    if (carreraId) {
      whereClause.carrera = { carreraId };
    }
    const correlativa = await this.correlativaRepo.findOne({
      where: whereClause,
    });
    if (!correlativa) throw new NotFoundException('Correlativa no encontrada');
    await this.correlativaRepo.remove(correlativa);
  }
}
