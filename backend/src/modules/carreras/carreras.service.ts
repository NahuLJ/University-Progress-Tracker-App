import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrera } from './entities/carrera.entity';
import { CarreraMateria } from './entities/carrera-materia.entity';
import { Materia } from '../materias/entities/materia.entity';
import { CrearCarreraDto } from './dto/crear-carrera.dto';
import { AgregarMateriaPlanDto } from './dto/agregar-materia-plan.dto';

@Injectable()
export class CarrerasService {
  constructor(
    @InjectRepository(Carrera)
    private readonly carreraRepo: Repository<Carrera>,
    @InjectRepository(CarreraMateria)
    private readonly carreraMateriaRepo: Repository<CarreraMateria>,
    @InjectRepository(Materia)
    private readonly materiaRepo: Repository<Materia>,
  ) {}

  async listar(): Promise<Carrera[]> {
    return this.carreraRepo.find({ order: { nombre: 'ASC' } });
  }

  async obtenerConPlan(id: number): Promise<Carrera> {
    const carrera = await this.carreraRepo.findOne({
      where: { carreraId: id },
      relations: { planEstudios: { materia: true } },
    });
    if (!carrera) throw new NotFoundException('Carrera no encontrada');
    return carrera;
  }

  async obtenerPlanEstudios(carreraId: number): Promise<CarreraMateria[]> {
    const carrera = await this.carreraRepo.findOne({ where: { carreraId } });
    if (!carrera) throw new NotFoundException('Carrera no encontrada');

    return this.carreraMateriaRepo.find({
      where: { carrera: { carreraId } },
      relations: {
        materia: { correlativasRequeridas: { materiaCorrelativa: true } },
      },
      order: { anio: 'ASC', cuatrimestre: 'ASC', orden: 'ASC' },
    });
  }

  async crear(dto: CrearCarreraDto): Promise<Carrera> {
    const carrera = this.carreraRepo.create(dto);
    return this.carreraRepo.save(carrera);
  }

  async agregarMateriaAlPlan(
    carreraId: number,
    dto: AgregarMateriaPlanDto,
  ): Promise<CarreraMateria> {
    const carrera = await this.carreraRepo.findOne({ where: { carreraId } });
    if (!carrera) throw new NotFoundException('Carrera no encontrada');

    const materia = await this.materiaRepo.findOne({
      where: { materiaId: dto.materiaId },
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
}
