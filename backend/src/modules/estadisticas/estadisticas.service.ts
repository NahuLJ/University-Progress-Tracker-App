import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull, DataSource } from 'typeorm';
import { UsuarioCarrera } from '../carreras/entities/usuario-carrera.entity';
import { CarreraMateria } from '../carreras/entities/carrera-materia.entity';
import { ProgresoMateria } from '../progreso/entities/progreso-materia.entity';
import { ResumenResponseDto } from './dto/resumen-carrera.dto';
import { CarreraResumenDto } from './dto/carrera-resumen.dto';
import { DistribucionEstadosDto } from './dto/estadisticas-response.dto';

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
      relations: { carrera: true },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

    const planEstudios = await this.carreraMateriaRepo.find({
      where: { carrera: { carreraId: inscripcion.carrera.carreraId } },
      relations: { materia: true },
    });
    const totalMaterias = planEstudios.length;
    const creditosTotales = planEstudios.reduce(
      (sum, cm) => sum + (cm.materia?.creditos ?? 0),
      0,
    );
    const idsMateriasPlan = planEstudios
      .map((cm) => cm.materia?.materiaId)
      .filter((id): id is number => id !== undefined);

    const progresos = await this.progresoRepo.find({
      where: {
        usuarioCarrera: { usuarioCarreraId },
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
      const cm = planEstudios.find(
        (e) => e.materia?.materiaId === p.materia?.materiaId,
      );
      return sum + (cm?.materia?.creditos ?? 0);
    }, 0);

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
      creditosObtenidos,
      creditosTotales,
      cuatrimestresRestantes,
      progresoPorcentaje,
    };
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

    return Promise.all(
      inscripciones.map(async (inscripcion) => {
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
      relations: { carrera: true },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

    const plan = await this.carreraMateriaRepo.find({
      where: { carrera: { carreraId: inscripcion.carrera.carreraId } },
    });
    const totalPlan = plan.length;

    const progresos = await this.progresoRepo.find({
      where: { usuarioCarrera: { usuarioCarreraId } },
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

  async obtenerEvolucion(usuarioCarreraId: number): Promise<any[]> {
    const progresos = await this.progresoRepo.find({
      where: {
        usuarioCarrera: { usuarioCarreraId },
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
