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

  async obtenerPlanEstudios(carreraId: number): Promise<{
    carrera: Carrera;
    materias: {
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
      correlativas: {
        correlativaId: number;
        materiaId: number;
        materiaCorrelativaId: number;
        materiaCorrelativa: { materiaId: number; nombre: string; codigo: string };
      }[];
    }[];
    anios: {
      anio: number;
      cuatrimestres: {
        cuatrimestre: number;
        materias: {
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
          correlativas: {
            correlativaId: number;
            materiaId: number;
            materiaCorrelativaId: number;
            materiaCorrelativa: { materiaId: number; nombre: string; codigo: string };
          }[];
        }[];
      }[];
    }[];
  }> {
    const carrera = await this.carreraRepo.findOne({ where: { carreraId } });
    if (!carrera) throw new NotFoundException('Carrera no encontrada');

    const entries = await this.carreraMateriaRepo.find({
      where: { carrera: { carreraId } },
      relations: {
        materia: { correlativasRequeridas: { materiaCorrelativa: true } },
      },
      order: { anio: 'ASC', cuatrimestre: 'ASC', orden: 'ASC' },
    });

    const materias = entries.map((e) => ({
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
      correlativas: (e.materia.correlativasRequeridas ?? []).map((c) => ({
        correlativaId: c.correlativaId,
        materiaId: e.materia.materiaId,
        materiaCorrelativaId: c.materiaCorrelativa.materiaId,
        materiaCorrelativa: {
          materiaId: c.materiaCorrelativa.materiaId,
          nombre: c.materiaCorrelativa.nombre,
          codigo: c.materiaCorrelativa.codigo,
        },
      })),
    }));

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
