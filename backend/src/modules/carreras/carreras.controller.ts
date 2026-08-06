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
  Request,
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
import { ActualizarSistemaCreditosDto } from '../creditos/dto/actualizar-sistema-creditos.dto';
import { AgregarCategoriaCreditoDto } from '../creditos/dto/agregar-categoria-credito.dto';
import { ActualizarCategoriaCreditoDto } from '../creditos/dto/actualizar-categoria-credito.dto';
import { AgregarActividadCreditoDto } from '../creditos/dto/agregar-actividad-credito.dto';

import { ActualizarRequisitosActividadDto } from '../creditos/dto/actualizar-requisitos-actividad.dto';

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
    @Request() req: { user: { usuarioId: number } },
  ) {
    return this.carrerasService.obtenerPlanEstudios(id, req.user.usuarioId);
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

  @Get(':id/creditos')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener configuración del sistema de créditos de la carrera',
  })
  @ApiResponse({ status: 200, description: 'Config del sistema de créditos' })
  @ApiResponse({ status: 404, description: 'Carrera no encontrada' })
  async obtenerConfigCreditos(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { usuarioId: number } },
  ) {
    return this.carrerasService.obtenerConfigCreditos(id, req.user.usuarioId);
  }

  @Put(':id/creditos')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Habilitar/deshabilitar sistema de créditos' })
  @ApiResponse({ status: 200, description: 'Sistema actualizado' })
  @ApiResponse({ status: 400, description: 'Validación fallida' })
  async actualizarSistemaCreditos(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarSistemaCreditosDto,
  ) {
    return this.carrerasService.actualizarSistemaCreditos(id, dto);
  }

  @Post(':id/creditos/categorias')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar categoría al sistema de créditos' })
  @ApiResponse({ status: 201, description: 'Categoría agregada' })
  @ApiResponse({ status: 400, description: 'Validación fallida' })
  async agregarCategoriaCreditos(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AgregarCategoriaCreditoDto,
  ) {
    return this.carrerasService.agregarCategoriaCreditos(id, dto);
  }

  @Put(':id/creditos/categorias/:carreraCategoriaCreditoId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar el mínimo de una categoría' })
  @ApiResponse({ status: 200, description: 'Categoría actualizada' })
  @ApiResponse({ status: 400, description: 'Validación fallida' })
  async actualizarCategoriaCreditos(
    @Param('id', ParseIntPipe) id: number,
    @Param('carreraCategoriaCreditoId', ParseIntPipe)
    carreraCategoriaCreditoId: number,
    @Body() dto: ActualizarCategoriaCreditoDto,
  ) {
    return this.carrerasService.actualizarCategoriaCreditos(
      id,
      carreraCategoriaCreditoId,
      dto,
    );
  }

  @Delete(':id/creditos/categorias/:carreraCategoriaCreditoId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Quitar categoría (y sus actividades) del sistema de créditos',
  })
  @ApiResponse({ status: 200, description: 'Categoría quitada' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  async quitarCategoriaCreditos(
    @Param('id', ParseIntPipe) id: number,
    @Param('carreraCategoriaCreditoId', ParseIntPipe)
    carreraCategoriaCreditoId: number,
  ) {
    await this.carrerasService.quitarCategoriaCreditos(
      id,
      carreraCategoriaCreditoId,
    );
    return { message: 'Categoría quitada del sistema de créditos' };
  }

  @Post(':id/creditos/actividades')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar actividad al sistema de créditos' })
  @ApiResponse({ status: 201, description: 'Actividad agregada' })
  @ApiResponse({ status: 400, description: 'Validación fallida' })
  async agregarActividadCreditos(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AgregarActividadCreditoDto,
  ) {
    return this.carrerasService.agregarActividadCreditos(id, dto);
  }

  @Delete(':id/creditos/actividades/:carreraActividadCreditoId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quitar actividad del sistema de créditos' })
  @ApiResponse({ status: 200, description: 'Actividad quitada' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  async quitarActividadCreditos(
    @Param('id', ParseIntPipe) id: number,
    @Param('carreraActividadCreditoId', ParseIntPipe)
    carreraActividadCreditoId: number,
  ) {
    await this.carrerasService.quitarActividadCreditos(
      id,
      carreraActividadCreditoId,
    );
    return { message: 'Actividad quitada del sistema de créditos' };
  }

  @Put(':id/creditos/actividades/:carreraActividadCreditoId/requisitos')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Editar las materias requisito de una actividad (por carrera)',
  })
  @ApiResponse({ status: 200, description: 'Requisitos actualizados' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  async actualizarRequisitosActividadCreditos(
    @Param('id', ParseIntPipe) id: number,
    @Param('carreraActividadCreditoId', ParseIntPipe)
    carreraActividadCreditoId: number,
    @Body() dto: ActualizarRequisitosActividadDto,
  ) {
    return this.carrerasService.actualizarRequisitosActividadCreditos(
      id,
      carreraActividadCreditoId,
      dto,
    );
  }
}
