import {
  Controller,
  Get,
  Post,
  Patch,
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
  ApiQuery,
} from '@nestjs/swagger';
import { TrayectoriaService } from './trayectoria.service';
import { CrearTrayectoriaDto } from './dto/crear-trayectoria.dto';
import { ActualizarTrayectoriaDto } from './dto/actualizar-trayectoria.dto';

@ApiTags('Trayectorias')
@ApiBearerAuth()
@Controller('trayectorias')
export class TrayectoriaController {
  constructor(private readonly trayectoriaService: TrayectoriaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar trayectorias de una inscripción' })
  @ApiQuery({ name: 'usuarioCarreraId', required: true })
  async listarTrayectorias(
    @Query('usuarioCarreraId', ParseIntPipe) usuarioCarreraId: number,
  ) {
    return this.trayectoriaService.listarTrayectorias(usuarioCarreraId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva trayectoria' })
  @ApiResponse({ status: 201, description: 'Trayectoria creada' })
  @ApiResponse({ status: 409, description: 'Nombre duplicado' })
  async crearTrayectoria(@Body() dto: CrearTrayectoriaDto) {
    return this.trayectoriaService.crearTrayectoria(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar trayectoria' })
  @ApiResponse({ status: 200, description: 'Trayectoria actualizada' })
  @ApiResponse({ status: 404, description: 'Trayectoria no encontrada' })
  async actualizarTrayectoria(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarTrayectoriaDto,
  ) {
    return this.trayectoriaService.actualizarTrayectoria(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar trayectoria y todas sus planificaciones' })
  @ApiResponse({ status: 200, description: 'Trayectoria eliminada' })
  @ApiResponse({ status: 404, description: 'Trayectoria no encontrada' })
  async eliminarTrayectoria(@Param('id', ParseIntPipe) id: number) {
    await this.trayectoriaService.eliminarTrayectoria(id);
    return { message: 'Trayectoria eliminada exitosamente' };
  }

  @Get(':id/planificaciones')
  @ApiOperation({
    summary: 'Listar planificaciones de una trayectoria ordenadas',
  })
  async listarPlanificacionesDeTrayectoria(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.trayectoriaService.listarPlanificacionesDeTrayectoria(id);
  }

  @Get(':id/arbol')
  @ApiOperation({
    summary: 'Obtener árbol de bifurcaciones de una trayectoria',
  })
  async obtenerArbol(@Param('id', ParseIntPipe) id: number) {
    return this.trayectoriaService.obtenerArbol(id);
  }
}
