import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trayectoria } from './entities/trayectoria.entity';
import { CrearTrayectoriaDto } from './dto/crear-trayectoria.dto';
import { ActualizarTrayectoriaDto } from './dto/actualizar-trayectoria.dto';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { PeriodoPlanificacion } from '../planificacion/entities/periodo-planificacion.entity';
import { MateriaPlanificada } from '../planificacion/entities/materia-planificada.entity';

const ORDEN_INSTANCIA: Record<string, number> = {
  Verano: 0,
  '1er Cuatrimestre': 1,
  '2do Cuatrimestre': 2,
};

export interface NodoArbol {
  periodo: PeriodoPlanificacion | null;
  hijos: NodoArbol[];
}

@Injectable()
export class TrayectoriaService {
  constructor(
    @InjectRepository(Trayectoria)
    private readonly trayectoriaRepo: Repository<Trayectoria>,
    @InjectRepository(UsuarioCarrera)
    private readonly usuarioCarreraRepo: Repository<UsuarioCarrera>,
    @InjectRepository(PeriodoPlanificacion)
    private readonly periodoRepo: Repository<PeriodoPlanificacion>,
    @InjectRepository(MateriaPlanificada)
    private readonly materiaPlanificadaRepo: Repository<MateriaPlanificada>,
  ) {}

  async listarTrayectorias(usuarioCarreraId: number): Promise<Trayectoria[]> {
    return this.trayectoriaRepo.find({
      where: { usuarioCarreraId },
      relations: { planificaciones: true },
      order: { creadoEn: 'DESC' },
    });
  }

  async crearTrayectoria(dto: CrearTrayectoriaDto): Promise<Trayectoria> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId: dto.usuarioCarreraId },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

    const existente = await this.trayectoriaRepo.findOne({
      where: {
        usuarioCarreraId: dto.usuarioCarreraId,
        nombre: dto.nombre,
      },
    });
    if (existente) {
      throw new ConflictException(
        'Ya existe una trayectoria con ese nombre en esta carrera',
      );
    }

    const trayectoria = this.trayectoriaRepo.create({
      usuarioCarreraId: dto.usuarioCarreraId,
      nombre: dto.nombre,
    });
    return this.trayectoriaRepo.save(trayectoria);
  }

  async actualizarTrayectoria(
    id: number,
    dto: ActualizarTrayectoriaDto,
  ): Promise<Trayectoria> {
    const trayectoria = await this.trayectoriaRepo.findOne({
      where: { trayectoriaId: id },
    });
    if (!trayectoria) throw new NotFoundException('Trayectoria no encontrada');

    if (dto.nombre !== undefined) trayectoria.nombre = dto.nombre;

    return this.trayectoriaRepo.save(trayectoria);
  }

  async eliminarTrayectoria(id: number): Promise<void> {
    const trayectoria = await this.trayectoriaRepo.findOne({
      where: { trayectoriaId: id },
    });
    if (!trayectoria) throw new NotFoundException('Trayectoria no encontrada');

    await this.trayectoriaRepo.remove(trayectoria);
  }

  async obtenerArbol(id: number): Promise<NodoArbol> {
    const trayectoria = await this.trayectoriaRepo.findOne({
      where: { trayectoriaId: id },
    });
    if (!trayectoria) throw new NotFoundException('Trayectoria no encontrada');

    const periodos = await this.periodoRepo.find({
      where: { trayectoriaId: id },
      relations: {
        materiasPlanificadas: { materia: true, bloque: true },
        planificacionOrigen: true,
      },
      order: { anio: 'ASC', instancia: 'ASC' },
    });

    const mapa = new Map<number | null, PeriodoPlanificacion[]>();
    for (const p of periodos) {
      const key = p.planificacionOrigenId ?? null;
      if (!mapa.has(key)) mapa.set(key, []);
      mapa.get(key)!.push(p);
    }

    function construirArbol(
      padreId: number | null,
      visitados: Set<number>,
    ): NodoArbol[] {
      const hijos = mapa.get(padreId) ?? [];
      return hijos
        .filter((h) => !visitados.has(h.periodoId))
        .map((h) => {
          visitados.add(h.periodoId);
          return {
            periodo: h,
            hijos: construirArbol(h.periodoId, visitados),
          };
        });
    }

    const raices = construirArbol(null, new Set());
    return raices.length > 0
      ? { periodo: raices[0].periodo, hijos: raices[0].hijos }
      : { periodo: null as unknown as PeriodoPlanificacion, hijos: [] };
  }

  async validarOrdenCronologico(
    trayectoriaId: number,
    anio: number,
    instancia: string,
  ): Promise<void> {
    const anteriores = await this.periodoRepo.find({
      where: { trayectoriaId },
      order: { anio: 'DESC', instancia: 'DESC' },
    });

    const instanciaNum = ORDEN_INSTANCIA[instancia];
    for (const p of anteriores) {
      const pInstanciaNum = ORDEN_INSTANCIA[p.instancia];
      if (p.anio > anio || (p.anio === anio && pInstanciaNum >= instanciaNum)) {
        throw new ConflictException(
          'Ya existe una planificación posterior o igual en esta trayectoria. El nuevo período debe ser cronológicamente posterior.',
        );
      }
    }
  }

  async listarPlanificacionesDeTrayectoria(
    trayectoriaId: number,
  ): Promise<PeriodoPlanificacion[]> {
    const trayectoria = await this.trayectoriaRepo.findOne({
      where: { trayectoriaId },
    });
    if (!trayectoria) throw new NotFoundException('Trayectoria no encontrada');

    return this.periodoRepo.find({
      where: { trayectoriaId },
      relations: { materiasPlanificadas: { materia: true, bloque: true } },
      order: { anio: 'ASC', instancia: 'ASC' },
    });
  }
}
