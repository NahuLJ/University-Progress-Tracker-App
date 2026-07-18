import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Materia } from './entities/materia.entity';
import { Correlativa } from './entities/correlativa.entity';
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

  async obtenerConRelaciones(id: number): Promise<Materia> {
    const materia = await this.materiaRepo.findOne({
      where: { materiaId: id },
      relations: {
        correlativasRequeridas: { materiaCorrelativa: true },
        planEstudios: { carrera: true },
      },
    });
    if (!materia) throw new NotFoundException('Materia no encontrada');
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

    const existente = await this.correlativaRepo.findOne({
      where: {
        materia: { materiaId },
        materiaCorrelativa: { materiaId: dto.materiaCorrelativaId },
      },
    });
    if (existente)
      throw new BadRequestException('Esta correlativa ya está asignada');

    const entry = this.correlativaRepo.create({
      materia,
      materiaCorrelativa: correlativa,
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
