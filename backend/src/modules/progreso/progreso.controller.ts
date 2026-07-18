import { Controller, Get, Put, Post, Param, Query, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProgresoService } from './progreso.service';
import { ActualizarProgresoDto } from './dto/actualizar-progreso.dto';

@ApiTags('Progreso')
@ApiBearerAuth()
@Controller('progreso')
export class ProgresoController {
  constructor(private readonly progresoService: ProgresoService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener progreso por carrera' })
  @ApiResponse({ status: 200, description: 'Lista de progreso' })
  async obtenerPorCarrera(@Query('usuarioCarreraId') usuarioCarreraId: number) {
    return this.progresoService.obtenerPorCarrera(usuarioCarreraId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener progreso individual' })
  @ApiResponse({ status: 200, description: 'Datos del progreso' })
  @ApiResponse({ status: 404, description: 'Progreso no encontrado' })
  async obtenerPorId(@Param('id') id: number) {
    return this.progresoService.obtenerPorId(id);
  }

  @Post('inicializar')
  @ApiOperation({ summary: 'Inicializar progreso para una carrera' })
  @ApiResponse({ status: 201, description: 'Progreso inicializado' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  async inicializar(@Body() dto: { usuarioCarreraId: number }) {
    return this.progresoService.inicializar(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar estado y nota de una materia' })
  @ApiResponse({ status: 200, description: 'Progreso actualizado' })
  @ApiResponse({
    status: 400,
    description: 'Error de validación o correlativas pendientes',
  })
  @ApiResponse({ status: 404, description: 'Progreso no encontrado' })
  async actualizar(
    @Param('id') id: number,
    @Body() dto: ActualizarProgresoDto,
  ) {
    return this.progresoService.actualizar(id, dto);
  }
}
