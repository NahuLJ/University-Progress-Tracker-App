import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SistemaCreditos } from './entities/sistema-creditos.entity';
import { CategoriaCredito } from './entities/categoria-credito.entity';
import { ActividadCredito } from './entities/actividad-credito.entity';
import { ActividadRequisitoMateria } from './entities/actividad-requisito-materia.entity';
import { CarreraCategoriaCredito } from './entities/carrera-categoria-credito.entity';
import { CarreraActividadCredito } from './entities/carrera-actividad-credito.entity';
import { ProgresoActividad } from './entities/progreso-actividad.entity';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { Materia } from '../materias/entities/materia.entity';
import { ProgresoMateria } from '../progreso/entities/progreso-materia.entity';
import { CrearCategoriaCreditoDto } from './dto/crear-categoria-credito.dto';
import { CrearActividadCreditoDto } from './dto/crear-actividad-credito.dto';
import { ActualizarActividadCreditoDto } from './dto/actualizar-actividad-credito.dto';
import { ActualizarSistemaCreditosDto } from './dto/actualizar-sistema-creditos.dto';
import { AgregarCategoriaCreditoDto } from './dto/agregar-categoria-credito.dto';
import { ActualizarCategoriaCreditoDto } from './dto/actualizar-categoria-credito.dto';
import { AgregarActividadCreditoDto } from './dto/agregar-actividad-credito.dto';
import { CrearProgresoActividadDto } from './dto/crear-progreso-actividad.dto';
import { CreditosProgresoResponseDto } from './dto/creditos-progreso.dto';

export interface MateriaRequisitoResultado {
  materiaId: number;
  nombre: string;
  codigo: string;
  aprobada: boolean;
}

export interface CategoriaConfiguracion {
  carreraCategoriaCreditoId: number;
  categoriaCreditoId: number;
  nombre: string;
  minimoCreditos: number;
  obtenidos: number;
  cumplida: boolean;
}

export interface ActividadConfiguracion {
  carreraActividadCreditoId: number;
  actividadCreditoId: number;
  nombre: string;
  creditos: number;
  categoriaCreditoId: number;
  categoriaNombre: string;
  progresoActividadId: number | null;
  completada: boolean;
  materiasRequeridas: MateriaRequisitoResultado[];
}

export interface ConfiguracionCreditosCarrera {
  sistemaCreditos: boolean;
  totalCreditos: number;
  creditosObtenidos: number;
  creditosFaltantes: number;
  completado: boolean;
  progresoPorcentaje: number;
  categorias: CategoriaConfiguracion[];
  actividades: ActividadConfiguracion[];
}

function esErrorDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as Record<string, unknown>).code === 'ER_DUP_ENTRY'
  );
}

@Injectable()
export class CreditosService {
  constructor(
    @InjectRepository(SistemaCreditos)
    private readonly sistemaRepo: Repository<SistemaCreditos>,
    @InjectRepository(CategoriaCredito)
    private readonly categoriaRepo: Repository<CategoriaCredito>,
    @InjectRepository(ActividadCredito)
    private readonly actividadRepo: Repository<ActividadCredito>,
    @InjectRepository(ActividadRequisitoMateria)
    private readonly actividadRequisitoRepo: Repository<ActividadRequisitoMateria>,
    @InjectRepository(CarreraCategoriaCredito)
    private readonly carreraCategoriaRepo: Repository<CarreraCategoriaCredito>,
    @InjectRepository(CarreraActividadCredito)
    private readonly carreraActividadRepo: Repository<CarreraActividadCredito>,
    @InjectRepository(ProgresoActividad)
    private readonly progresoRepo: Repository<ProgresoActividad>,
    @InjectRepository(UsuarioCarrera)
    private readonly usuarioCarreraRepo: Repository<UsuarioCarrera>,
    @InjectRepository(Materia)
    private readonly materiaRepo: Repository<Materia>,
    @InjectRepository(ProgresoMateria)
    private readonly progresoMateriaRepo: Repository<ProgresoMateria>,
  ) {}

  // ---------- Catálogo global ----------

  async listarCategorias(
    incluirInactivas?: boolean,
  ): Promise<CategoriaCredito[]> {
    return this.categoriaRepo.find({
      where: incluirInactivas ? {} : { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async crearCategoria(
    dto: CrearCategoriaCreditoDto,
  ): Promise<CategoriaCredito> {
    const categoria = this.categoriaRepo.create(dto);
    try {
      return await this.categoriaRepo.save(categoria);
    } catch (error) {
      if (esErrorDuplicado(error)) {
        throw new BadRequestException('Ya existe una categoría con ese nombre');
      }
      throw error;
    }
  }

  async listarActividades(
    categoriaId?: number,
    search?: string,
  ): Promise<ActividadCredito[]> {
    const qb = this.actividadRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.categoria', 'categoria')
      .leftJoinAndSelect('a.materiasRequeridas', 'requisito')
      .leftJoinAndSelect('requisito.materia', 'materia')
      .orderBy('a.nombre', 'ASC');

    if (categoriaId) {
      qb.andWhere('categoria.categoriaCreditoId = :categoriaId', {
        categoriaId,
      });
    }
    if (search) {
      qb.andWhere('a.nombre LIKE :search', { search: `%${search}%` });
    }
    return qb.getMany();
  }

  async crearActividad(
    dto: CrearActividadCreditoDto,
  ): Promise<ActividadCredito> {
    const categoria = await this.categoriaRepo.findOne({
      where: { categoriaCreditoId: dto.categoriaCreditoId },
    });
    if (!categoria) throw new NotFoundException('Categoría no encontrada');

    await this.validarMateriasRequisito(dto.materiasRequeridas);

    const actividad = this.actividadRepo.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      creditos: dto.creditos,
      categoria,
    });

    try {
      const guardada = await this.actividadRepo.save(actividad);
      if (dto.materiasRequeridas && dto.materiasRequeridas.length > 0) {
        await this.reemplazarRequisitos(
          guardada.actividadCreditoId,
          dto.materiasRequeridas,
        );
      }
      return await this.buscarActividadCompleta(guardada.actividadCreditoId);
    } catch (error) {
      if (esErrorDuplicado(error)) {
        throw new BadRequestException(
          'Ya existe una actividad con ese nombre en la categoría',
        );
      }
      throw error;
    }
  }

  async actualizarActividad(
    actividadCreditoId: number,
    dto: ActualizarActividadCreditoDto,
  ): Promise<ActividadCredito> {
    const actividad = await this.actividadRepo.findOne({
      where: { actividadCreditoId },
    });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');

    if (dto.materiasRequeridas !== undefined) {
      await this.validarMateriasRequisito(dto.materiasRequeridas);
    }

    if (dto.nombre !== undefined) actividad.nombre = dto.nombre;
    if (dto.descripcion !== undefined) actividad.descripcion = dto.descripcion;
    if (dto.creditos !== undefined) actividad.creditos = dto.creditos;

    try {
      await this.actividadRepo.save(actividad);
      if (dto.materiasRequeridas !== undefined) {
        await this.reemplazarRequisitos(
          actividadCreditoId,
          dto.materiasRequeridas,
        );
      }
    } catch (error) {
      if (esErrorDuplicado(error)) {
        throw new BadRequestException(
          'Ya existe una actividad con ese nombre en la categoría',
        );
      }
      throw error;
    }

    return this.buscarActividadCompleta(actividadCreditoId);
  }

  // ---------- Configuración por carrera ----------

  async obtenerConfiguracionCarrera(
    carreraId: number,
    usuarioCarreraId?: number,
  ): Promise<ConfiguracionCreditosCarrera> {
    const sistema = await this.sistemaRepo.findOne({
      where: { carrera: { carreraId } },
    });

    const [categoriasCarrera, actividadesCarrera] = await Promise.all([
      this.carreraCategoriaRepo.find({
        where: { carrera: { carreraId } },
        relations: { categoria: true },
      }),
      this.carreraActividadRepo.find({
        where: { carrera: { carreraId } },
        relations: {
          actividad: { categoria: true, materiasRequeridas: { materia: true } },
        },
      }),
    ]);
    categoriasCarrera.sort((a, b) =>
      a.categoria.nombre.localeCompare(b.categoria.nombre),
    );

    let usuarioId: number | undefined;
    if (usuarioCarreraId) {
      const inscripcion = await this.usuarioCarreraRepo.findOne({
        where: { usuarioCarreraId },
        relations: { usuario: true },
      });
      usuarioId = inscripcion?.usuario?.usuarioId;
    }

    let progresos: ProgresoActividad[] = [];
    let progresosMateria: ProgresoMateria[] = [];
    if (usuarioId) {
      [progresos, progresosMateria] = await Promise.all([
        this.progresoRepo.find({
          where: { usuario: { usuarioId } },
          relations: { actividad: true },
        }),
        this.progresoMateriaRepo.find({
          where: { usuario: { usuarioId }, estado: { nombre: 'Completada' } },
          relations: { materia: true, estado: true },
        }),
      ]);
    }

    const materiasAprobadasIds = new Set(
      progresosMateria.map((pm) => pm.materia.materiaId),
    );
    const completadasIds = new Set(
      progresos
        .filter((p) => p.completada)
        .map((p) => p.actividad.actividadCreditoId),
    );

    const creditosPorCategoria = new Map<number, number>();
    let creditosObtenidos = 0;
    for (const ca of actividadesCarrera) {
      if (!completadasIds.has(ca.actividad.actividadCreditoId)) continue;
      creditosObtenidos += ca.actividad.creditos;
      const catId = ca.actividad.categoria.categoriaCreditoId;
      creditosPorCategoria.set(
        catId,
        (creditosPorCategoria.get(catId) ?? 0) + ca.actividad.creditos,
      );
    }

    const categorias: CategoriaConfiguracion[] = categoriasCarrera.map((cc) => {
      const obtenidos =
        creditosPorCategoria.get(cc.categoria.categoriaCreditoId) ?? 0;
      return {
        carreraCategoriaCreditoId: cc.carreraCategoriaCreditoId,
        categoriaCreditoId: cc.categoria.categoriaCreditoId,
        nombre: cc.categoria.nombre,
        minimoCreditos: cc.minimoCreditos,
        obtenidos,
        cumplida: obtenidos >= cc.minimoCreditos,
      };
    });

    const actividades: ActividadConfiguracion[] = actividadesCarrera.map(
      (ca) => {
        const requisitos: MateriaRequisitoResultado[] = (
          ca.actividad.materiasRequeridas ?? []
        ).map((r) => ({
          materiaId: r.materia.materiaId,
          nombre: r.materia.nombre,
          codigo: r.materia.codigo,
          aprobada: materiasAprobadasIds.has(r.materia.materiaId),
        }));
        const progreso = progresos.find(
          (p) =>
            p.actividad.actividadCreditoId === ca.actividad.actividadCreditoId,
        );
        return {
          carreraActividadCreditoId: ca.carreraActividadCreditoId,
          actividadCreditoId: ca.actividad.actividadCreditoId,
          nombre: ca.actividad.nombre,
          creditos: ca.actividad.creditos,
          categoriaCreditoId: ca.actividad.categoria.categoriaCreditoId,
          categoriaNombre: ca.actividad.categoria.nombre,
          progresoActividadId: progreso?.progresoActividadId ?? null,
          completada: completadasIds.has(ca.actividad.actividadCreditoId),
          materiasRequeridas: requisitos,
        };
      },
    );

    if (!sistema) {
      return {
        sistemaCreditos: false,
        totalCreditos: 0,
        creditosObtenidos,
        creditosFaltantes: 0,
        completado: false,
        progresoPorcentaje: 0,
        categorias,
        actividades,
      };
    }

    const completado =
      creditosObtenidos >= sistema.totalCreditos &&
      categorias.every((c) => c.cumplida);

    const creditosFaltantes = Math.max(
      0,
      sistema.totalCreditos - creditosObtenidos,
      categorias.reduce(
        (sum, c) => sum + Math.max(0, c.minimoCreditos - c.obtenidos),
        0,
      ),
    );

    return {
      sistemaCreditos: true,
      totalCreditos: sistema.totalCreditos,
      creditosObtenidos,
      creditosFaltantes,
      completado,
      progresoPorcentaje:
        sistema.totalCreditos > 0
          ? Math.min(
              100,
              Math.round((creditosObtenidos / sistema.totalCreditos) * 100),
            )
          : 0,
      categorias,
      actividades,
    };
  }

  async actualizarSistema(
    carreraId: number,
    dto: ActualizarSistemaCreditosDto,
  ): Promise<SistemaCreditos | { message: string }> {
    const existente = await this.sistemaRepo.findOne({
      where: { carrera: { carreraId } },
    });

    if (!dto.creditosHabilitado) {
      if (existente) {
        await this.sistemaRepo.delete({
          sistemaCreditosId: existente.sistemaCreditosId,
        });
        await this.carreraCategoriaRepo.delete({ carrera: { carreraId } });
        await this.carreraActividadRepo.delete({ carrera: { carreraId } });
      }
      return { message: 'Sistema de créditos deshabilitado' };
    }

    if (!dto.totalCreditos || dto.totalCreditos <= 0) {
      throw new BadRequestException(
        'Debés indicar un total de créditos mayor a 0 para habilitar el sistema',
      );
    }

    const categorias = await this.carreraCategoriaRepo.find({
      where: { carrera: { carreraId } },
    });
    const sumaMinimos = categorias.reduce(
      (sum, c) => sum + c.minimoCreditos,
      0,
    );
    if (sumaMinimos > dto.totalCreditos) {
      throw new BadRequestException(
        `La suma de mínimos por categoría (${sumaMinimos}) supera el total de créditos (${dto.totalCreditos})`,
      );
    }

    if (existente) {
      existente.totalCreditos = dto.totalCreditos;
      return this.sistemaRepo.save(existente);
    }
    return this.sistemaRepo.save(
      this.sistemaRepo.create({
        carrera: { carreraId },
        totalCreditos: dto.totalCreditos,
      }),
    );
  }

  async agregarCategoria(
    carreraId: number,
    dto: AgregarCategoriaCreditoDto,
  ): Promise<CarreraCategoriaCredito> {
    const sistema = await this.sistemaRepo.findOne({
      where: { carrera: { carreraId } },
    });
    if (!sistema) {
      throw new BadRequestException(
        'La carrera no tiene el sistema de créditos activado',
      );
    }

    const categoria = await this.categoriaRepo.findOne({
      where: { categoriaCreditoId: dto.categoriaCreditoId },
    });
    if (!categoria) throw new NotFoundException('Categoría no encontrada');

    const existente = await this.carreraCategoriaRepo.findOne({
      where: {
        carrera: { carreraId },
        categoria: { categoriaCreditoId: dto.categoriaCreditoId },
      },
    });
    if (existente) {
      throw new BadRequestException(
        'La categoría ya está en el sistema de la carrera',
      );
    }

    const otras = await this.carreraCategoriaRepo.find({
      where: { carrera: { carreraId } },
    });
    const sumaMinimos =
      otras.reduce((sum, c) => sum + c.minimoCreditos, 0) + dto.minimoCreditos;
    if (sumaMinimos > sistema.totalCreditos) {
      throw new BadRequestException(
        `La suma de mínimos por categoría (${sumaMinimos}) supera el total de créditos (${sistema.totalCreditos})`,
      );
    }

    return this.carreraCategoriaRepo.save(
      this.carreraCategoriaRepo.create({
        carrera: { carreraId },
        categoria,
        minimoCreditos: dto.minimoCreditos,
      }),
    );
  }

  async actualizarCategoria(
    carreraCategoriaCreditoId: number,
    dto: ActualizarCategoriaCreditoDto,
  ): Promise<CarreraCategoriaCredito> {
    const pivote = await this.carreraCategoriaRepo.findOne({
      where: { carreraCategoriaCreditoId },
      relations: { carrera: true },
    });
    if (!pivote)
      throw new NotFoundException('Registro de categoría no encontrado');

    const sistema = await this.sistemaRepo.findOne({
      where: { carrera: { carreraId: pivote.carrera.carreraId } },
    });
    if (!sistema) {
      throw new BadRequestException(
        'La carrera no tiene el sistema de créditos activado',
      );
    }

    const otras = await this.carreraCategoriaRepo.find({
      where: { carrera: { carreraId: pivote.carrera.carreraId } },
    });
    const sumaResto = otras
      .filter((c) => c.carreraCategoriaCreditoId !== carreraCategoriaCreditoId)
      .reduce((sum, c) => sum + c.minimoCreditos, 0);
    if (sumaResto + dto.minimoCreditos > sistema.totalCreditos) {
      throw new BadRequestException(
        'La suma de mínimos por categoría supera el total de créditos',
      );
    }

    pivote.minimoCreditos = dto.minimoCreditos;
    return this.carreraCategoriaRepo.save(pivote);
  }

  async quitarCategoria(
    carreraId: number,
    carreraCategoriaCreditoId: number,
  ): Promise<void> {
    const pivote = await this.carreraCategoriaRepo.findOne({
      where: { carreraCategoriaCreditoId, carrera: { carreraId } },
    });
    if (!pivote)
      throw new NotFoundException('Registro de categoría no encontrado');

    const actividades = await this.carreraActividadRepo.find({
      where: { carrera: { carreraId } },
      relations: { actividad: { categoria: true } },
    });
    const aEliminar = actividades.filter(
      (ca) =>
        ca.actividad.categoria.categoriaCreditoId ===
        pivote.categoria.categoriaCreditoId,
    );

    if (aEliminar.length > 0) {
      await this.carreraActividadRepo.delete(
        aEliminar.map((ca) => ca.carreraActividadCreditoId),
      );
    }
    await this.carreraCategoriaRepo.delete({ carreraCategoriaCreditoId });
  }

  async agregarActividad(
    carreraId: number,
    dto: AgregarActividadCreditoDto,
  ): Promise<CarreraActividadCredito> {
    const sistema = await this.sistemaRepo.findOne({
      where: { carrera: { carreraId } },
    });
    if (!sistema) {
      throw new BadRequestException(
        'La carrera no tiene el sistema de créditos activado',
      );
    }

    const actividad = await this.actividadRepo.findOne({
      where: { actividadCreditoId: dto.actividadCreditoId },
      relations: { categoria: true },
    });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');

    const categoriaDeCarrera = await this.carreraCategoriaRepo.findOne({
      where: {
        carrera: { carreraId },
        categoria: {
          categoriaCreditoId: actividad.categoria.categoriaCreditoId,
        },
      },
    });
    if (!categoriaDeCarrera) {
      throw new BadRequestException(
        'La actividad pertenece a una categoría que no está en el sistema de la carrera',
      );
    }

    const existente = await this.carreraActividadRepo.findOne({
      where: {
        carrera: { carreraId },
        actividad: { actividadCreditoId: dto.actividadCreditoId },
      },
    });
    if (existente) {
      throw new BadRequestException(
        'La actividad ya está en el sistema de la carrera',
      );
    }

    return this.carreraActividadRepo.save(
      this.carreraActividadRepo.create({
        carrera: { carreraId },
        actividad,
      }),
    );
  }

  async quitarActividad(
    carreraId: number,
    carreraActividadCreditoId: number,
  ): Promise<void> {
    const pivote = await this.carreraActividadRepo.findOne({
      where: { carreraActividadCreditoId, carrera: { carreraId } },
    });
    if (!pivote)
      throw new NotFoundException('Registro de actividad no encontrado');
    await this.carreraActividadRepo.delete({ carreraActividadCreditoId });
  }

  // ---------- Progreso del usuario ----------

  async obtenerProgreso(
    usuarioCarreraId: number,
  ): Promise<CreditosProgresoResponseDto> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId },
      relations: { carrera: true, usuario: true },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');
    const carreraId = inscripcion.carrera.carreraId;
    const usuarioId = inscripcion.usuario.usuarioId;

    const sistema = await this.sistemaRepo.findOne({
      where: { carrera: { carreraId } },
    });

    const [categoriasCarrera, actividadesCarrera] = await Promise.all([
      this.carreraCategoriaRepo.find({
        where: { carrera: { carreraId } },
        relations: { categoria: true },
      }),
      this.carreraActividadRepo.find({
        where: { carrera: { carreraId } },
        relations: {
          actividad: { categoria: true, materiasRequeridas: { materia: true } },
        },
      }),
    ]);
    categoriasCarrera.sort((a, b) =>
      a.categoria.nombre.localeCompare(b.categoria.nombre),
    );

    const [progresos, progresosMateria] = await Promise.all([
      this.progresoRepo.find({
        where: { usuario: { usuarioId } },
        relations: { actividad: true },
      }),
      this.progresoMateriaRepo.find({
        where: { usuario: { usuarioId }, estado: { nombre: 'Completada' } },
        relations: { materia: true, estado: true },
      }),
    ]);

    const materiasAprobadasIds = new Set(
      progresosMateria.map((pm) => pm.materia.materiaId),
    );
    const completadasIds = new Set(
      progresos
        .filter((p) => p.completada)
        .map((p) => p.actividad.actividadCreditoId),
    );

    const creditosPorCategoria = new Map<number, number>();
    let creditosObtenidos = 0;
    for (const ca of actividadesCarrera) {
      if (!completadasIds.has(ca.actividad.actividadCreditoId)) continue;
      creditosObtenidos += ca.actividad.creditos;
      const catId = ca.actividad.categoria.categoriaCreditoId;
      creditosPorCategoria.set(
        catId,
        (creditosPorCategoria.get(catId) ?? 0) + ca.actividad.creditos,
      );
    }

    const categorias = categoriasCarrera.map((cc) => {
      const obtenidos =
        creditosPorCategoria.get(cc.categoria.categoriaCreditoId) ?? 0;
      return {
        categoriaCreditoId: cc.categoria.categoriaCreditoId,
        nombre: cc.categoria.nombre,
        minimo: cc.minimoCreditos,
        obtenidos,
        cumplida: obtenidos >= cc.minimoCreditos,
      };
    });

    const actividades = actividadesCarrera.map((ca) => {
      const requisitos = (ca.actividad.materiasRequeridas ?? []).map((r) => ({
        materiaId: r.materia.materiaId,
        nombre: r.materia.nombre,
        codigo: r.materia.codigo,
        aprobada: materiasAprobadasIds.has(r.materia.materiaId),
      }));
      return {
        progresoActividadId:
          progresos.find(
            (p) =>
              p.actividad.actividadCreditoId ===
              ca.actividad.actividadCreditoId,
          )?.progresoActividadId ?? null,
        actividadCreditoId: ca.actividad.actividadCreditoId,
        nombre: ca.actividad.nombre,
        descripcion: ca.actividad.descripcion,
        creditos: ca.actividad.creditos,
        categoriaCreditoId: ca.actividad.categoria.categoriaCreditoId,
        categoriaNombre: ca.actividad.categoria.nombre,
        completada: completadasIds.has(ca.actividad.actividadCreditoId),
        requisitos,
        requisitosCumplidos: requisitos.every((r) => r.aprobada),
      };
    });

    if (!sistema) {
      return {
        sistemaCreditos: false,
        carreraId,
        totalRequerido: 0,
        creditosObtenidos: 0,
        creditosFaltantes: 0,
        completado: false,
        progresoPorcentaje: 0,
        categorias: [],
        actividades: [],
      };
    }

    const completado =
      creditosObtenidos >= sistema.totalCreditos &&
      categorias.every((c) => c.cumplida);

    const creditosFaltantes = Math.max(
      0,
      sistema.totalCreditos - creditosObtenidos,
      categorias.reduce(
        (sum, c) => sum + Math.max(0, c.minimo - c.obtenidos),
        0,
      ),
    );

    return {
      sistemaCreditos: true,
      carreraId,
      totalRequerido: sistema.totalCreditos,
      creditosObtenidos,
      creditosFaltantes,
      completado,
      progresoPorcentaje:
        sistema.totalCreditos > 0
          ? Math.min(
              100,
              Math.round((creditosObtenidos / sistema.totalCreditos) * 100),
            )
          : 0,
      categorias,
      actividades,
    };
  }

  async marcarCompletada(
    dto: CrearProgresoActividadDto,
  ): Promise<ProgresoActividad> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId: dto.usuarioCarreraId },
      relations: { usuario: true },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');
    const usuarioId = inscripcion.usuario.usuarioId;

    const actividad = await this.actividadRepo.findOne({
      where: { actividadCreditoId: dto.actividadCreditoId },
      relations: { materiasRequeridas: { materia: true } },
    });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');

    const materiasRequeridas = actividad.materiasRequeridas ?? [];
    if (materiasRequeridas.length > 0) {
      const idsRequisito = materiasRequeridas.map((r) => r.materia.materiaId);
      const aprobadas = await this.progresoMateriaRepo.find({
        where: {
          usuario: { usuarioId },
          materia: { materiaId: In(idsRequisito) },
          estado: { nombre: 'Completada' },
        },
        relations: { materia: true, estado: true },
      });
      const aprobadasIds = new Set(aprobadas.map((p) => p.materia.materiaId));
      const faltantes = materiasRequeridas
        .filter((r) => !aprobadasIds.has(r.materia.materiaId))
        .map((r) => r.materia.nombre);
      if (faltantes.length > 0) {
        throw new BadRequestException(
          `No podés completar "${actividad.nombre}": tenés que aprobar antes: ${faltantes.join(', ')}`,
        );
      }
    }

    let progreso = await this.progresoRepo.findOne({
      where: {
        usuario: { usuarioId },
        actividad: { actividadCreditoId: dto.actividadCreditoId },
      },
    });
    if (!progreso) {
      progreso = this.progresoRepo.create({
        usuario: { usuarioId },
        actividad: { actividadCreditoId: dto.actividadCreditoId },
        completada: true,
        fechaCompletado: new Date().toISOString().slice(0, 10),
      });
    } else {
      progreso.completada = true;
      progreso.fechaCompletado = new Date().toISOString().slice(0, 10);
    }
    return this.progresoRepo.save(progreso);
  }

  async desmarcar(progresoActividadId: number): Promise<ProgresoActividad> {
    const progreso = await this.progresoRepo.findOne({
      where: { progresoActividadId },
    });
    if (!progreso)
      throw new NotFoundException('Progreso de actividad no encontrado');
    progreso.completada = false;
    progreso.fechaCompletado = null;
    return this.progresoRepo.save(progreso);
  }

  // ---------- Helpers ----------

  private async validarMateriasRequisito(
    materiasIds?: number[],
  ): Promise<void> {
    if (!materiasIds || materiasIds.length === 0) return;
    const materias = await this.materiaRepo.find({
      where: { materiaId: In(materiasIds), activo: true },
    });
    if (materias.length !== materiasIds.length) {
      throw new BadRequestException(
        'Algunas materias requisito no existen o no están activas',
      );
    }
  }

  private async reemplazarRequisitos(
    actividadCreditoId: number,
    materiasIds: number[],
  ): Promise<void> {
    await this.actividadRequisitoRepo.delete({
      actividad: { actividadCreditoId },
    });
    if (materiasIds.length === 0) return;
    const pivotes = materiasIds.map((materiaId) =>
      this.actividadRequisitoRepo.create({
        actividad: { actividadCreditoId },
        materia: { materiaId },
      }),
    );
    await this.actividadRequisitoRepo.save(pivotes);
  }

  private async buscarActividadCompleta(
    actividadCreditoId: number,
  ): Promise<ActividadCredito> {
    const actividad = await this.actividadRepo.findOne({
      where: { actividadCreditoId },
      relations: { categoria: true, materiasRequeridas: { materia: true } },
    });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');
    return actividad;
  }
}
