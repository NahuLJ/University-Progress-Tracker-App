import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PlanificacionService } from './planificacion.service';
import { CrearPeriodoDto } from './dto/crear-periodo.dto';
import { ActualizarPeriodoDto } from './dto/actualizar-periodo.dto';
import { PlanificarMateriaDto } from './dto/planificar-materia.dto';

@ApiTags('Planificación')
@ApiBearerAuth()
@Controller('planificacion')
export class PlanificacionController {
  constructor(private readonly planificacionService: PlanificacionService) {}

  @Get('periodos')
  @ApiOperation({ summary: 'Listar períodos de planificación' })
  @ApiResponse({ status: 200, description: 'Lista de períodos' })
  async listarPeriodos(@Query('usuarioCarreraId') usuarioCarreraId: number) {
    return this.planificacionService.listarPeriodos(usuarioCarreraId);
  }

  @Get('periodos-paginado')
  @ApiOperation({ summary: 'Listar períodos de planificación paginado' })
  @ApiQuery({ name: 'usuarioCarreraId', required: true })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 12 })
  @ApiResponse({ status: 200, description: 'Lista paginada de períodos' })
  async listarPeriodosPaginado(
    @Query('usuarioCarreraId', ParseIntPipe) usuarioCarreraId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) {
    return this.planificacionService.listarPeriodosPaginado(
      usuarioCarreraId,
      page,
      limit,
    );
  }

  @Post('periodos')
  @ApiOperation({ summary: 'Crear período de planificación' })
  @ApiResponse({ status: 201, description: 'Período creado' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  async crearPeriodo(@Body() dto: CrearPeriodoDto) {
    return this.planificacionService.crearPeriodo(dto);
  }

  @Delete('periodos/:id')
  @ApiOperation({ summary: 'Eliminar período de planificación' })
  @ApiResponse({ status: 200, description: 'Período eliminado' })
  @ApiResponse({ status: 404, description: 'Período no encontrado' })
  async eliminarPeriodo(@Param('id', ParseIntPipe) id: number) {
    await this.planificacionService.eliminarPeriodo(id);
    return { message: 'Período eliminado exitosamente' };
  }

  @Patch('periodos/:id')
  @ApiOperation({ summary: 'Actualizar período de planificación' })
  @ApiResponse({ status: 200, description: 'Período actualizado' })
  @ApiResponse({ status: 404, description: 'Período no encontrado' })
  async actualizarPeriodo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarPeriodoDto,
  ) {
    return this.planificacionService.actualizarPeriodo(id, dto);
  }

  @Get('disponibles')
  @ApiOperation({
    summary:
      'Materias disponibles para planificar (no completadas, con correlativas cumplidas)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de materias disponibles',
  })
  async obtenerMateriasDisponibles(
    @Query('usuarioCarreraId') usuarioCarreraId: number,
  ) {
    return this.planificacionService.obtenerMateriasDisponibles(
      usuarioCarreraId,
    );
  }

  @Get('bloques')
  @ApiOperation({ summary: 'Listar bloques horarios' })
  @ApiResponse({ status: 200, description: 'Lista de bloques' })
  async listarBloques() {
    return this.planificacionService.listarBloques();
  }

  @Get('periodos/:id/materias')
  @ApiOperation({ summary: 'Obtener materias planificadas en un período' })
  @ApiResponse({ status: 200, description: 'Materias planificadas' })
  @ApiResponse({ status: 404, description: 'Período no encontrado' })
  async obtenerMateriasDelPeriodo(@Param('id') id: number) {
    return this.planificacionService.obtenerMateriasDelPeriodo(id);
  }

  @Post('periodos/:id/materias')
  @ApiOperation({ summary: 'Planificar materia en un período' })
  @ApiResponse({ status: 201, description: 'Materia planificada' })
  @ApiResponse({ status: 400, description: 'Conflicto de horario' })
  @ApiResponse({ status: 404, description: 'Período o materia no encontrada' })
  async planificarMateria(
    @Param('id') id: number,
    @Body() dto: PlanificarMateriaDto,
  ) {
    return this.planificacionService.planificarMateria(id, dto);
  }

  @Get('periodos/:id/materias-desbloqueables')
  @ApiOperation({
    summary:
      'Materias que se desbloquearían al completar las planificadas en el período',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de materias desbloqueables',
  })
  @ApiResponse({ status: 404, description: 'Período no encontrado' })
  async obtenerMateriasDesbloqueables(
    @Param('id') id: number,
    @Query('materiaIds') materiaIds?: string,
  ) {
    const ids =
      materiaIds !== undefined
        ? materiaIds === ''
          ? []
          : materiaIds
              .split(',')
              .map(Number)
              .filter((n) => !isNaN(n))
        : undefined;
    return this.planificacionService.obtenerMateriasDesbloqueables(id, ids);
  }

  @Delete('materias/:id')
  @ApiOperation({ summary: 'Eliminar materia planificada' })
  @ApiResponse({
    status: 200,
    description: 'Materia removida de la planificación',
  })
  @ApiResponse({ status: 404, description: 'Planificación no encontrada' })
  async eliminarMateriaPlanificada(@Param('id') id: number) {
    await this.planificacionService.eliminarMateriaPlanificada(id);
    return { message: 'Materia removida de la planificación' };
  }
}
