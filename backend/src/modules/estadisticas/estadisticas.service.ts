import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull, DataSource } from 'typeorm';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { CarreraMateria } from '../carreras/entities/carrera-materia.entity';
import { ProgresoMateria } from '../progreso/entities/progreso-materia.entity';
import { ResumenResponseDto } from './dto/resumen-carrera.dto';
import { CarreraResumenDto } from './dto/carrera-resumen.dto';
import { DistribucionEstadosDto } from './dto/estadisticas-response.dto';
import { NotasDistribucionDto } from './dto/notas-distribucion.dto';
import { ProgresoPorAnioDto } from './dto/progreso-por-anio.dto';

@Injectable()
export class EstadisticasService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UsuarioCarrera)
    private readonly usuarioCarreraRepo: Repository<UsuarioCarrera>,
    @InjectRepository(CarreraMateria)
    private readonly carreraMateriaRepo: Repository<CarreraMateria>,
    @InjectRepository(ProgresoMateria)
    private readonly progresoRepo: Repository<ProgresoMateria>,
  ) {}

  async obtenerResumen(usuarioCarreraId: number): Promise<ResumenResponseDto> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId },
      relations: { carrera: true, usuario: true },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');
    const usuarioId = inscripcion.usuario.usuarioId;

    const planEstudios = await this.carreraMateriaRepo.find({
      where: { carrera: { carreraId: inscripcion.carrera.carreraId } },
      relations: { materia: true },
    });
    const planActivo = planEstudios.filter(
      (cm) => cm.materia?.activo !== false,
    );
    const totalMaterias = planActivo.length;
    const creditosTotales = planActivo.reduce(
      (sum, cm) => sum + (cm.materia?.creditos ?? 0),
      0,
    );
    const idsMateriasPlan = planActivo
      .map((cm) => cm.materia?.materiaId)
      .filter((id): id is number => id !== undefined);

    const progresos = await this.progresoRepo.find({
      where: {
        usuario: { usuarioId },
        materia: { materiaId: In(idsMateriasPlan) },
      },
      relations: { estado: true, materia: true },
    });

    const completadas = progresos.filter(
      (p) => p.estado.nombre === 'Completada',
    );
    const enProceso = progresos.filter((p) => p.estado.nombre === 'En Proceso');
    const pendientesRegistrados = progresos.filter(
      (p) => p.estado.nombre === 'Pendiente',
    );
    const sinRegistro = totalMaterias - progresos.length;

    const materiasCompletadas = completadas.length;
    const materiasEnProceso = enProceso.length;
    const materiasPendientes = pendientesRegistrados.length + sinRegistro;

    const notasValidas = completadas.filter((p) => p.nota !== null);
    const promedioGeneral =
      notasValidas.length > 0
        ? Math.round(
            (notasValidas.reduce((sum, p) => sum + p.nota!, 0) /
              notasValidas.length) *
              100,
          ) / 100
        : 0;

    const creditosObtenidos = completadas.reduce((sum, p) => {
      const cm = planActivo.find(
        (e) => e.materia?.materiaId === p.materia?.materiaId,
      );
      return sum + (cm?.materia?.creditos ?? 0);
    }, 0);

    const materiasDisponibles = await this.calcularMateriasDisponibles(
      inscripcion.carrera.carreraId,
      usuarioId,
    );

    const cuatrimestresRestantes = await this.calcularCuatrimestresRestantes(
      inscripcion.carrera.carreraId,
      progresos,
    );

    const progresoPorcentaje =
      totalMaterias > 0
        ? Math.round((materiasCompletadas / totalMaterias) * 1000) / 10
        : 0;

    return {
      promedioGeneral,
      materiasCompletadas,
      materiasEnProceso,
      materiasPendientes,
      totalMaterias,
      materiasDisponibles,
      creditosObtenidos,
      creditosTotales,
      cuatrimestresRestantes,
      progresoPorcentaje,
    };
  }

  private async calcularMateriasDisponibles(
    carreraId: number,
    usuarioId: number,
  ): Promise<number> {
    const plan = await this.carreraMateriaRepo.find({
      where: { carrera: { carreraId } },
      relations: {
        materia: {
          correlativasRequeridas: { materiaCorrelativa: true, carrera: true },
        },
      },
    });

    const progresos = await this.progresoRepo.find({
      where: { usuario: { usuarioId } },
      relations: { materia: true, estado: true },
    });
    const idsCompletadas = new Set(
      progresos
        .filter((p) => p.estado?.nombre === 'Completada')
        .map((p) => p.materia?.materiaId),
    );

    let disponibles = 0;
    for (const cm of plan) {
      const materia = cm.materia;
      if (!materia?.activo) continue;
      const materiaId = materia.materiaId;
      if (idsCompletadas.has(materiaId)) continue;

      const correlativas = (materia.correlativasRequeridas ?? []).filter(
        (c) => c.carrera.carreraId === carreraId,
      );
      const todasAprobadas = correlativas.every((c) =>
        idsCompletadas.has(c.materiaCorrelativa.materiaId),
      );
      if (todasAprobadas) disponibles++;
    }

    return disponibles;
  }

  private async calcularCuatrimestresRestantes(
    carreraId: number,
    progresos: ProgresoMateria[],
  ): Promise<number> {
    const plan = await this.carreraMateriaRepo.find({
      where: { carrera: { carreraId } },
      order: { anio: 'ASC', cuatrimestre: 'ASC' },
    });

    if (plan.length === 0) return 0;

    const materiasCompletadasIds = progresos
      .filter((p) => p.estado?.nombre === 'Completada')
      .map((p) => p.materia?.materiaId)
      .filter((id): id is number => id !== undefined);

    const materiasPendientes = plan.filter(
      (cm) => !materiasCompletadasIds.includes(cm.materia?.materiaId),
    );

    if (materiasPendientes.length === 0) return 0;

    const capacidadPorCuatrimestre: Record<string, number> = {};
    for (const cm of plan) {
      const key = `${cm.anio}-${cm.cuatrimestre}`;
      capacidadPorCuatrimestre[key] = (capacidadPorCuatrimestre[key] || 0) + 1;
    }
    const maxMateriasPorCuatrimestre = Math.max(
      ...Object.values(capacidadPorCuatrimestre),
    );

    return Math.ceil(materiasPendientes.length / maxMateriasPorCuatrimestre);
  }

  async obtenerCarrerasResumen(
    usuarioId: number,
  ): Promise<CarreraResumenDto[]> {
    const inscripciones = await this.usuarioCarreraRepo.find({
      where: { usuario: { usuarioId } },
      relations: { carrera: true },
    });

    // Filtrar solo carreras activas (no eliminadas lógicamente por admin)
    const inscripcionesActivas = inscripciones.filter(
      (i) => i.carrera.activo !== false,
    );

    return Promise.all(
      inscripcionesActivas.map(async (inscripcion) => {
        const resumen = await this.obtenerResumen(inscripcion.usuarioCarreraId);
        return {
          usuarioCarreraId: inscripcion.usuarioCarreraId,
          carrera: {
            carreraId: inscripcion.carrera.carreraId,
            nombre: inscripcion.carrera.nombre,
          },
          activo: inscripcion.activo,
          materiasCompletadas: resumen.materiasCompletadas,
          materiasTotales: resumen.totalMaterias,
          progresoPorcentaje: resumen.progresoPorcentaje,
          promedioGeneral: resumen.promedioGeneral,
        };
      }),
    );
  }

  async obtenerDistribucionEstados(
    usuarioCarreraId: number,
  ): Promise<DistribucionEstadosDto[]> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId },
      relations: { carrera: true, usuario: true },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

    const plan = await this.carreraMateriaRepo.find({
      where: { carrera: { carreraId: inscripcion.carrera.carreraId } },
      relations: { materia: true },
    });
    const planActivo = plan.filter((cm) => cm.materia?.activo !== false);
    const totalPlan = planActivo.length;
    const idsMateriasPlan = planActivo
      .map((cm) => cm.materia?.materiaId)
      .filter((id): id is number => id !== undefined);

    const progresos = await this.progresoRepo.find({
      where: {
        usuario: { usuarioId: inscripcion.usuario.usuarioId },
        materia: { materiaId: In(idsMateriasPlan) },
      },
      relations: { estado: true },
    });

    const completadas = progresos.filter(
      (p) => p.estado.nombre === 'Completada',
    ).length;
    const enProceso = progresos.filter(
      (p) => p.estado.nombre === 'En Proceso',
    ).length;
    const pendientes = totalPlan - completadas - enProceso;

    return [
      { estado: 'Completada', cantidad: completadas },
      { estado: 'En Proceso', cantidad: enProceso },
      { estado: 'Pendiente', cantidad: Math.max(0, pendientes) },
    ];
  }

  async obtenerNotasDistribucion(
    usuarioCarreraId: number,
  ): Promise<NotasDistribucionDto> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId },
      relations: { carrera: true, usuario: true },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

    const plan = await this.carreraMateriaRepo.find({
      where: { carrera: { carreraId: inscripcion.carrera.carreraId } },
      relations: { materia: true },
    });
    const planActivo = plan.filter((cm) => cm.materia?.activo !== false);
    const idsMateriasPlan = planActivo
      .map((cm) => cm.materia?.materiaId)
      .filter((id): id is number => id !== undefined);

    const progresos = await this.progresoRepo.find({
      where: {
        usuario: { usuarioId: inscripcion.usuario.usuarioId },
        materia: { materiaId: In(idsMateriasPlan) },
      },
      relations: { estado: true },
    });
    const notasValidas = progresos
      .filter((p) => p.estado.nombre === 'Completada' && p.nota !== null)
      .map((p) => p.nota!);

    const RANGOS = ['4-5', '6', '7', '8', '9', '10'] as const;
    const conteo: Record<string, number> = Object.fromEntries(
      RANGOS.map((r) => [r, 0]),
    );
    for (const nota of notasValidas) {
      const rango =
        nota <= 5
          ? '4-5'
          : nota === 6
            ? '6'
            : nota === 7
              ? '7'
              : nota === 8
                ? '8'
                : nota === 9
                  ? '9'
                  : '10';
      conteo[rango] += 1;
    }

    return {
      promedioGeneral:
        notasValidas.length > 0
          ? Math.round(
              (notasValidas.reduce((s, n) => s + n, 0) / notasValidas.length) *
                100,
            ) / 100
          : 0,
      materiasConNota: notasValidas.length,
      rangos: RANGOS.map((rango) => ({ rango, cantidad: conteo[rango] })),
    };
  }

  async obtenerProgresoPorAnio(
    usuarioCarreraId: number,
  ): Promise<ProgresoPorAnioDto[]> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId },
      relations: { carrera: true, usuario: true },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

    const plan = await this.carreraMateriaRepo.find({
      where: { carrera: { carreraId: inscripcion.carrera.carreraId } },
      relations: { materia: true },
      order: { anio: 'ASC' },
    });
    const planActivo = plan.filter((cm) => cm.materia?.activo !== false);
    const idsMateriasPlan = planActivo
      .map((cm) => cm.materia?.materiaId)
      .filter((id): id is number => id !== undefined);

    const progresos = await this.progresoRepo.find({
      where: {
        usuario: { usuarioId: inscripcion.usuario.usuarioId },
        materia: { materiaId: In(idsMateriasPlan) },
      },
      relations: { estado: true, materia: true },
    });

    const anios = [...new Set(planActivo.map((cm) => cm.anio))].sort(
      (a, b) => a - b,
    );

    return anios.map((anio) => {
      const materiasDelAnio = planActivo.filter((cm) => cm.anio === anio);
      const total = materiasDelAnio.length;
      const idsDelAnio = new Set(
        materiasDelAnio.map((cm) => cm.materia?.materiaId),
      );
      const progresosDelAnio = progresos.filter((p) =>
        idsDelAnio.has(p.materia?.materiaId),
      );
      const completadas = progresosDelAnio.filter(
        (p) => p.estado.nombre === 'Completada',
      ).length;
      const enProceso = progresosDelAnio.filter(
        (p) => p.estado.nombre === 'En Proceso',
      ).length;

      return {
        anio,
        completadas,
        enProceso,
        pendientes: Math.max(0, total - completadas - enProceso),
      };
    });
  }

  async obtenerEvolucion(usuarioCarreraId: number): Promise<any[]> {
    const inscripcion = await this.usuarioCarreraRepo.findOne({
      where: { usuarioCarreraId },
      relations: { usuario: true },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

    const progresos = await this.progresoRepo.find({
      where: {
        usuario: { usuarioId: inscripcion.usuario.usuarioId },
        estado: { nombre: 'Completada' },
        fechaCompletado: Not(IsNull()),
        nota: Not(IsNull()),
      },
      relations: { materia: true, estado: true },
    });

    const agrupado: Record<string, { sum: number; count: number }> = {};
    for (const p of progresos) {
      if (!p.fechaCompletado) continue;
      const [anioStr, mesStr] = p.fechaCompletado.split('-');
      const mes = parseInt(mesStr, 10);
      const anio = parseInt(anioStr, 10);
      let cuatrimestre: number;
      if (mes <= 4) cuatrimestre = 1;
      else if (mes <= 8) cuatrimestre = 2;
      else cuatrimestre = 0;

      const key = `${anio}-${cuatrimestre}`;
      if (!agrupado[key]) agrupado[key] = { sum: 0, count: 0 };
      agrupado[key].sum += p.nota!;
      agrupado[key].count += 1;
    }

    return Object.entries(agrupado)
      .map(([key, data]) => {
        const [anio, cuatrimestre] = key.split('-').map(Number);
        return {
          anio,
          cuatrimestre,
          instancia:
            cuatrimestre === 0 ? 'Verano' : `${cuatrimestre}° Cuatrimestre`,
          promedio: Math.round((data.sum / data.count) * 100) / 100,
          materiasAprobadas: data.count,
        };
      })
      .sort((a, b) => a.anio - b.anio || a.cuatrimestre - b.cuatrimestre);
  }
}
