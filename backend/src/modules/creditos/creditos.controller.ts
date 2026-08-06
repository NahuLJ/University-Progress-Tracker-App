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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreditosService } from './creditos.service';
import { CrearCategoriaCreditoDto } from './dto/crear-categoria-credito.dto';
import { CrearActividadCreditoDto } from './dto/crear-actividad-credito.dto';
import { ActualizarActividadCreditoDto } from './dto/actualizar-actividad-credito.dto';
import { ActualizarCategoriaCatalogoCreditoDto } from './dto/actualizar-categoria-catalogo-credito.dto';
import { CrearProgresoActividadDto } from './dto/crear-progreso-actividad.dto';

@ApiTags('Créditos')
@ApiBearerAuth()
@Controller('creditos')
export class CreditosController {
  constructor(private readonly creditosService: CreditosService) {}

  @Get('categorias')
  @ApiOperation({ summary: 'Listar categorías de créditos' })
  @ApiResponse({ status: 200, description: 'Lista de categorías' })
  async listarCategorias(@Query('incluirInactivas') incluirInactivas?: string) {
    return this.creditosService.listarCategorias(incluirInactivas === 'true');
  }

  @Post('categorias')
  @ApiOperation({ summary: 'Crear una categoría de créditos' })
  @ApiResponse({ status: 201, description: 'Categoría creada' })
  @ApiResponse({ status: 400, description: 'Nombre duplicado o inválido' })
  async crearCategoria(@Body() dto: CrearCategoriaCreditoDto) {
    return this.creditosService.crearCategoria(dto);
  }

  @Put('categorias/:categoriaCreditoId')
  @ApiOperation({ summary: 'Actualizar categoría del catálogo global' })
  @ApiResponse({ status: 200, description: 'Categoría actualizada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @ApiResponse({ status: 400, description: 'Nombre duplicado o inválido' })
  async actualizarCategoriaCatalogo(
    @Param('categoriaCreditoId', ParseIntPipe) categoriaCreditoId: number,
    @Body() dto: ActualizarCategoriaCatalogoCreditoDto,
  ) {
    return this.creditosService.actualizarCategoriaCatalogo(
      categoriaCreditoId,
      dto,
    );
  }

  @Delete('categorias/:categoriaCreditoId')
  @ApiOperation({
    summary: 'Dar de baja una categoría del catálogo y sus actividades',
  })
  @ApiResponse({ status: 200, description: 'Categoría desactivada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @ApiResponse({ status: 400, description: 'La categoría ya está inactiva' })
  async eliminarCategoriaCatalogo(
    @Param('categoriaCreditoId', ParseIntPipe) categoriaCreditoId: number,
  ) {
    return this.creditosService.eliminarCategoriaCatalogo(categoriaCreditoId);
  }

  @Patch('categorias/:categoriaCreditoId/restore')
  @ApiOperation({ summary: 'Restaurar una categoría del catálogo' })
  @ApiResponse({ status: 200, description: 'Categoría restaurada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @ApiResponse({ status: 400, description: 'La categoría ya está activa' })
  async restaurarCategoriaCatalogo(
    @Param('categoriaCreditoId', ParseIntPipe) categoriaCreditoId: number,
  ) {
    return this.creditosService.restaurarCategoriaCatalogo(categoriaCreditoId);
  }

  @Get('actividades')
  @ApiOperation({ summary: 'Listar actividades de créditos' })
  @ApiResponse({ status: 200, description: 'Lista de actividades' })
  async listarActividades(
    @Query('categoriaId') categoriaId?: string,
    @Query('search') search?: string,
    @Query('incluirInactivas') incluirInactivas?: string,
  ) {
    return this.creditosService.listarActividades(
      categoriaId ? Number(categoriaId) : undefined,
      search,
      incluirInactivas === 'true',
    );
  }

  @Post('actividades')
  @ApiOperation({ summary: 'Crear una actividad de créditos' })
  @ApiResponse({ status: 201, description: 'Actividad creada' })
  @ApiResponse({ status: 400, description: 'Validación fallida' })
  async crearActividad(@Body() dto: CrearActividadCreditoDto) {
    return this.creditosService.crearActividad(dto);
  }

  @Put('actividades/:actividadCreditoId')
  @ApiOperation({ summary: 'Actualizar actividad y sus materias requisito' })
  @ApiResponse({ status: 200, description: 'Actividad actualizada' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  async actualizarActividad(
    @Param('actividadCreditoId', ParseIntPipe) actividadCreditoId: number,
    @Body() dto: ActualizarActividadCreditoDto,
  ) {
    return this.creditosService.actualizarActividad(actividadCreditoId, dto);
  }

  @Delete('actividades/:actividadCreditoId')
  @ApiOperation({ summary: 'Dar de baja una actividad del catálogo' })
  @ApiResponse({ status: 200, description: 'Actividad desactivada' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  @ApiResponse({ status: 400, description: 'La actividad ya está inactiva' })
  async eliminarActividadCatalogo(
    @Param('actividadCreditoId', ParseIntPipe) actividadCreditoId: number,
  ) {
    return this.creditosService.eliminarActividadCatalogo(actividadCreditoId);
  }

  @Patch('actividades/:actividadCreditoId/restore')
  @ApiOperation({ summary: 'Restaurar una actividad del catálogo' })
  @ApiResponse({ status: 200, description: 'Actividad restaurada' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  @ApiResponse({ status: 400, description: 'La actividad ya está activa' })
  async restaurarActividadCatalogo(
    @Param('actividadCreditoId', ParseIntPipe) actividadCreditoId: number,
  ) {
    return this.creditosService.restaurarActividadCatalogo(actividadCreditoId);
  }

  @Get('progreso')
  @ApiOperation({ summary: 'Progreso del usuario en el sistema de créditos' })
  @ApiResponse({ status: 200, description: 'Progreso completo' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  async obtenerProgreso(
    @Query('usuarioCarreraId', ParseIntPipe) usuarioCarreraId: number,
  ) {
    return this.creditosService.obtenerProgreso(usuarioCarreraId);
  }

  @Post('progreso')
  @ApiOperation({ summary: 'Marcar una actividad como completada' })
  @ApiResponse({ status: 201, description: 'Progreso creado o actualizado' })
  @ApiResponse({
    status: 400,
    description: 'Requisitos de materias pendientes',
  })
  async marcarCompletada(@Body() dto: CrearProgresoActividadDto) {
    return this.creditosService.marcarCompletada(dto);
  }

  @Delete('progreso/:progresoActividadId')
  @ApiOperation({ summary: 'Desmarcar una actividad completada' })
  @ApiResponse({ status: 200, description: 'Progreso desmarcado' })
  @ApiResponse({ status: 404, description: 'Progreso no encontrado' })
  async desmarcar(
    @Param('progresoActividadId', ParseIntPipe) progresoActividadId: number,
  ) {
    return this.creditosService.desmarcar(progresoActividadId);
  }
}
