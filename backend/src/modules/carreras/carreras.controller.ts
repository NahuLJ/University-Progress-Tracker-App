import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CarrerasService } from './carreras.service';
import { CrearCarreraDto } from './dto/crear-carrera.dto';
import { AgregarMateriaPlanDto } from './dto/agregar-materia-plan.dto';

@ApiTags('Carreras')
@Controller('carreras')
export class CarrerasController {
  constructor(private readonly carrerasService: CarrerasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las carreras' })
  @ApiResponse({ status: 200, description: 'Lista de carreras' })
  async listar() {
    return this.carrerasService.listar();
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
  async obtenerPlanEstudios(@Param('id') id: number) {
    return this.carrerasService.obtenerPlanEstudios(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva carrera' })
  @ApiResponse({ status: 201, description: 'Carrera creada' })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  async crear(@Body() dto: CrearCarreraDto) {
    return this.carrerasService.crear(dto);
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
}
