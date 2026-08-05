import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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

  @Get('actividades')
  @ApiOperation({ summary: 'Listar actividades de créditos' })
  @ApiResponse({ status: 200, description: 'Lista de actividades' })
  async listarActividades(
    @Query('categoriaId') categoriaId?: string,
    @Query('search') search?: string,
  ) {
    return this.creditosService.listarActividades(
      categoriaId ? Number(categoriaId) : undefined,
      search,
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
