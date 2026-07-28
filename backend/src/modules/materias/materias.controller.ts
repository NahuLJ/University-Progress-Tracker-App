import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MateriasService } from './materias.service';
import { CrearMateriaDto } from './dto/crear-materia.dto';
import { ActualizarMateriaDto } from './dto/actualizar-materia.dto';
import { AsignarCorrelativaDto } from './dto/asignar-correlativa.dto';
import { FiltrarMateriasDto } from './dto/filtrar-materias.dto';

@ApiTags('Materias')
@Controller('materias')
export class MateriasController {
  constructor(private readonly materiasService: MateriasService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar materias con filtros, orden y paginación' })
  @ApiResponse({ status: 200, description: 'Lista paginada de materias' })
  async listar(@Query() query?: FiltrarMateriasDto) {
    return this.materiasService.listar(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una materia' })
  @ApiResponse({ status: 200, description: 'Datos de la materia' })
  @ApiResponse({ status: 404, description: 'Materia no encontrada' })
  async obtener(
    @Param('id') id: number,
    @Query('carreraId') carreraId?: number,
  ) {
    return this.materiasService.obtenerConRelaciones(id, carreraId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva materia' })
  @ApiResponse({ status: 201, description: 'Materia creada' })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  async crear(@Body() dto: CrearMateriaDto) {
    return this.materiasService.crear(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una materia' })
  @ApiResponse({ status: 200, description: 'Materia actualizada' })
  @ApiResponse({ status: 404, description: 'Materia no encontrada' })
  async actualizar(@Param('id') id: number, @Body() dto: ActualizarMateriaDto) {
    return this.materiasService.actualizar(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar materia con purge (baja lógica)' })
  @ApiResponse({ status: 200, description: 'Materia desactivada' })
  @ApiResponse({ status: 404, description: 'Materia no encontrada' })
  async eliminar(@Param('id') id: number) {
    await this.materiasService.eliminar(id);
    return { message: 'Materia desactivada exitosamente' };
  }

  @Patch(':id/restore')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restaurar materia desactivada' })
  @ApiResponse({ status: 200, description: 'Materia restaurada' })
  @ApiResponse({ status: 404, description: 'Materia no encontrada' })
  async restaurar(@Param('id') id: number) {
    return this.materiasService.restaurar(id);
  }

  @Post(':id/correlativas')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Asignar correlativa a una materia' })
  @ApiResponse({ status: 201, description: 'Correlativa asignada' })
  @ApiResponse({
    status: 400,
    description: 'Correlativa ya existe o es auto-referencial',
  })
  @ApiResponse({ status: 404, description: 'Materia no encontrada' })
  async asignarCorrelativa(
    @Param('id') id: number,
    @Body() dto: AsignarCorrelativaDto,
  ) {
    return this.materiasService.asignarCorrelativa(id, dto);
  }

  @Delete(':id/correlativas/:correlativaId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar correlativa' })
  @ApiResponse({ status: 200, description: 'Correlativa eliminada' })
  @ApiResponse({ status: 404, description: 'Correlativa no encontrada' })
  async eliminarCorrelativa(
    @Param('id') id: number,
    @Param('correlativaId') correlativaId: number,
    @Query('carreraId') _carreraId?: number,
  ) {
    await this.materiasService.eliminarCorrelativa(id, correlativaId);
    return { message: 'Correlativa eliminada exitosamente' };
  }
}
