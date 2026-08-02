import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CarrerasService } from './carreras.service';
import { CrearCarreraDto } from './dto/crear-carrera.dto';
import { ActualizarCarreraDto } from './dto/actualizar-carrera.dto';
import { AgregarMateriaPlanDto } from './dto/agregar-materia-plan.dto';
import { ActualizarMateriaPlanDto } from './dto/actualizar-materia-plan.dto';
import { FiltrarCarrerasDto } from './dto/filtrar-carreras.dto';

@ApiTags('Carreras')
@Controller('carreras')
export class CarrerasController {
  constructor(private readonly carrerasService: CarrerasService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar carreras con filtros, orden y paginación' })
  @ApiResponse({ status: 200, description: 'Lista paginada de carreras' })
  async listar(@Query() query?: FiltrarCarrerasDto) {
    return this.carrerasService.listar(query);
  }

  @Get('disponibles/:usuarioId')
  @ApiOperation({
    summary: 'Carreras disponibles para un usuario (no inscriptas)',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 12 })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de carreras disponibles',
  })
  async obtenerDisponibles(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) {
    return this.carrerasService.obtenerDisponibles(usuarioId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una carrera' })
  @ApiResponse({ status: 200, description: 'Datos de la carrera' })
  @ApiResponse({ status: 404, description: 'Carrera no encontrada' })
  async obtener(@Param('id') id: number) {
    return this.carrerasService.obtenerConPlan(id);
  }

  @Get(':id/plan-estudios')
  @ApiOperation({ summary: 'Obtener plan de estudios completo' })
  @ApiResponse({
    status: 200,
    description: 'Plan de estudios con correlativas',
  })
  @ApiResponse({ status: 404, description: 'Carrera no encontrada' })
  async obtenerPlanEstudios(
    @Param('id') id: number,
    @Query('usuarioCarreraId') usuarioCarreraId?: number,
  ) {
    return this.carrerasService.obtenerPlanEstudios(id, usuarioCarreraId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva carrera' })
  @ApiResponse({ status: 201, description: 'Carrera creada' })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  async crear(@Body() dto: CrearCarreraDto) {
    return this.carrerasService.crear(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una carrera' })
  @ApiResponse({ status: 200, description: 'Carrera actualizada' })
  @ApiResponse({ status: 404, description: 'Carrera no encontrada' })
  async actualizar(@Param('id') id: number, @Body() dto: ActualizarCarreraDto) {
    return this.carrerasService.actualizar(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar carrera (baja lógica)' })
  @ApiResponse({ status: 200, description: 'Carrera desactivada' })
  @ApiResponse({ status: 404, description: 'Carrera no encontrada' })
  async eliminar(@Param('id') id: number) {
    await this.carrerasService.eliminar(id);
    return { message: 'Carrera desactivada exitosamente' };
  }

  @Patch(':id/restore')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restaurar carrera desactivada' })
  @ApiResponse({ status: 200, description: 'Carrera restaurada' })
  @ApiResponse({ status: 404, description: 'Carrera no encontrada' })
  async restaurar(@Param('id') id: number) {
    return this.carrerasService.restaurar(id);
  }

  @Post(':id/materias')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar materia al plan de estudios' })
  @ApiResponse({ status: 201, description: 'Materia agregada al plan' })
  @ApiResponse({ status: 400, description: 'La materia ya existe en el plan' })
  @ApiResponse({ status: 404, description: 'Carrera o materia no encontrada' })
  async agregarMateria(
    @Param('id') id: number,
    @Body() dto: AgregarMateriaPlanDto,
  ) {
    return this.carrerasService.agregarMateriaAlPlan(id, dto);
  }

  @Put(':id/materias/:carreraMateriaId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar la posición de una materia en el plan de estudios',
  })
  @ApiResponse({ status: 200, description: 'Materia actualizada en el plan' })
  @ApiResponse({
    status: 400,
    description:
      'Error de validación (orden duplicado, correlativas inválidas, etc.)',
  })
  @ApiResponse({
    status: 404,
    description: 'Carrera o registro del plan no encontrado',
  })
  async actualizarMateriaEnPlan(
    @Param('id') id: number,
    @Param('carreraMateriaId') carreraMateriaId: number,
    @Body() dto: ActualizarMateriaPlanDto,
  ) {
    return this.carrerasService.actualizarMateriaEnPlan(
      id,
      carreraMateriaId,
      dto,
    );
  }

  @Delete(':id/materias/:carreraMateriaId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quitar materia del plan (baja física)' })
  @ApiResponse({ status: 200, description: 'Materia quitada del plan' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  async quitarMateria(
    @Param('id') id: number,
    @Param('carreraMateriaId') carreraMateriaId: number,
  ) {
    await this.carrerasService.quitarMateriaDelPlan(id, carreraMateriaId);
    return { message: 'Materia quitada del plan exitosamente' };
  }
}
