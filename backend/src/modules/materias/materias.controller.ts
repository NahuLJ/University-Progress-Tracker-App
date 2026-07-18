import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MateriasService } from './materias.service';
import { CrearMateriaDto } from './dto/crear-materia.dto';
import { AsignarCorrelativaDto } from './dto/asignar-correlativa.dto';

@ApiTags('Materias')
@Controller('materias')
export class MateriasController {
  constructor(private readonly materiasService: MateriasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las materias del catálogo' })
  @ApiResponse({ status: 200, description: 'Lista de materias' })
  async listar() {
    return this.materiasService.listar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una materia' })
  @ApiResponse({ status: 200, description: 'Datos de la materia' })
  @ApiResponse({ status: 404, description: 'Materia no encontrada' })
  async obtener(@Param('id') id: number) {
    return this.materiasService.obtenerConRelaciones(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva materia' })
  @ApiResponse({ status: 201, description: 'Materia creada' })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  async crear(@Body() dto: CrearMateriaDto) {
    return this.materiasService.crear(dto);
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
  ) {
    await this.materiasService.eliminarCorrelativa(id, correlativaId);
    return { message: 'Correlativa eliminada exitosamente' };
  }
}
