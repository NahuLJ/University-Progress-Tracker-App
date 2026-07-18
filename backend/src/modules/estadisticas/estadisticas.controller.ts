import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EstadisticasService } from './estadisticas.service';

@ApiTags('Estadísticas')
@ApiBearerAuth()
@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @Get('resumen')
  @ApiOperation({ summary: 'Obtener resumen de estadísticas académicas' })
  @ApiResponse({ status: 200, description: 'Resumen completo' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  async obtenerResumen(@Query('usuarioCarreraId') usuarioCarreraId: number) {
    return this.estadisticasService.obtenerResumen(usuarioCarreraId);
  }

  @Get('distribucion-estados')
  @ApiOperation({ summary: 'Obtener distribución de estados para gráficos' })
  @ApiResponse({ status: 200, description: 'Distribución por estado' })
  async obtenerDistribucionEstados(
    @Query('usuarioCarreraId') usuarioCarreraId: number,
  ) {
    return this.estadisticasService.obtenerDistribucionEstados(
      usuarioCarreraId,
    );
  }

  @Get('evolucion')
  @ApiOperation({ summary: 'Obtener evolución histórica de promedios' })
  @ApiResponse({ status: 200, description: 'Evolución por cuatrimestre' })
  async obtenerEvolucion(@Query('usuarioCarreraId') usuarioCarreraId: number) {
    return this.estadisticasService.obtenerEvolucion(usuarioCarreraId);
  }
}
