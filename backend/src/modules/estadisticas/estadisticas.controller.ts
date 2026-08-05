import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EstadisticasService } from './estadisticas.service';
import { CreditosService } from '../creditos/creditos.service';

@ApiTags('Estadísticas')
@ApiBearerAuth()
@Controller('estadisticas')
export class EstadisticasController {
  constructor(
    private readonly estadisticasService: EstadisticasService,
    private readonly creditosService: CreditosService,
  ) {}

  @Get('resumen')
  @ApiOperation({ summary: 'Obtener resumen de estadísticas académicas' })
  @ApiResponse({ status: 200, description: 'Resumen completo' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  async obtenerResumen(
    @Query('usuarioCarreraId', ParseIntPipe) usuarioCarreraId: number,
  ) {
    return this.estadisticasService.obtenerResumen(usuarioCarreraId);
  }

  @Get('distribucion-estados')
  @ApiOperation({ summary: 'Obtener distribución de estados para gráficos' })
  @ApiResponse({ status: 200, description: 'Distribución por estado' })
  async obtenerDistribucionEstados(
    @Query('usuarioCarreraId', ParseIntPipe) usuarioCarreraId: number,
  ) {
    return this.estadisticasService.obtenerDistribucionEstados(
      usuarioCarreraId,
    );
  }

  @Get('evolucion')
  @ApiOperation({ summary: 'Obtener evolución histórica de promedios' })
  @ApiResponse({ status: 200, description: 'Evolución por cuatrimestre' })
  async obtenerEvolucion(
    @Query('usuarioCarreraId', ParseIntPipe) usuarioCarreraId: number,
  ) {
    return this.estadisticasService.obtenerEvolucion(usuarioCarreraId);
  }

  @Get('notas-distribucion')
  @ApiOperation({ summary: 'Distribución de notas por rango de aprobación' })
  @ApiResponse({ status: 200, description: 'Rangos de notas y conteos' })
  async obtenerNotasDistribucion(
    @Query('usuarioCarreraId', ParseIntPipe) usuarioCarreraId: number,
  ) {
    return this.estadisticasService.obtenerNotasDistribucion(usuarioCarreraId);
  }

  @Get('progreso-por-anio')
  @ApiOperation({
    summary: 'Materias por año del plan (completadas, en proceso, pendientes)',
  })
  @ApiResponse({ status: 200, description: 'Progreso agrupado por año' })
  async obtenerProgresoPorAnio(
    @Query('usuarioCarreraId', ParseIntPipe) usuarioCarreraId: number,
  ) {
    return this.estadisticasService.obtenerProgresoPorAnio(usuarioCarreraId);
  }

  @Get('carreras-resumen')
  @ApiOperation({ summary: 'Resumen de progreso por cada carrera del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de resúmenes por carrera' })
  async obtenerCarrerasResumen(
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.estadisticasService.obtenerCarrerasResumen(usuarioId);
  }

  @Get('creditos-progreso')
  @ApiOperation({ summary: 'Progreso del sistema de créditos por actividades' })
  @ApiResponse({ status: 200, description: 'Progreso del sistema de créditos' })
  async obtenerCreditosProgreso(
    @Query('usuarioCarreraId', ParseIntPipe) usuarioCarreraId: number,
  ) {
    return this.creditosService.obtenerProgreso(usuarioCarreraId);
  }
}
