import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { InscribirCarreraDto } from './dto/inscribir-carrera.dto';
import { JwtAuthGuard } from '../auth/auth.guard';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obtener perfil de usuario' })
  @ApiResponse({ status: 200, description: 'Datos del usuario' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async obtenerPerfil(@Param('id') id: number) {
    return this.usuariosService.obtenerPerfil(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar perfil de usuario' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async actualizarPerfil(
    @Param('id') id: number,
    @Body() dto: ActualizarUsuarioDto,
  ) {
    return this.usuariosService.actualizarPerfil(id, dto);
  }

  @Get(':id/carreras')
  @ApiOperation({ summary: 'Obtener carreras del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de carreras' })
  async obtenerCarreras(@Param('id') id: number) {
    return this.usuariosService.obtenerCarreras(id);
  }

  @Get(':id/carreras-activas')
  @ApiOperation({
    summary: 'Obtener carreras activas del usuario (sin soft delete)',
  })
  @ApiResponse({ status: 200, description: 'Lista de carreras activas' })
  async obtenerCarrerasActivas(@Param('id') id: number) {
    return this.usuariosService.obtenerCarrerasActivas(id);
  }

  @Post(':id/carreras')
  @ApiOperation({ summary: 'Inscribir usuario en una carrera' })
  @ApiResponse({ status: 201, description: 'Inscripción creada' })
  @ApiResponse({ status: 400, description: 'Ya está inscripto' })
  @ApiResponse({ status: 404, description: 'Carrera no encontrada' })
  async inscribirCarrera(
    @Param('id') id: number,
    @Body() dto: InscribirCarreraDto,
  ) {
    return this.usuariosService.inscribirCarrera(id, dto);
  }

  @Delete(':id/carreras/:usuarioCarreraId')
  @ApiOperation({
    summary: 'Desactivar inscripción en una carrera (soft delete)',
  })
  @ApiResponse({ status: 200, description: 'Inscripción desactivada' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  async desactivarCarrera(
    @Param('id') id: number,
    @Param('usuarioCarreraId') usuarioCarreraId: number,
  ) {
    await this.usuariosService.desactivarCarrera(id, usuarioCarreraId);
    return { message: 'Inscripción desactivada exitosamente' };
  }

  @Patch(':id/carreras/:usuarioCarreraId/reactivar')
  @ApiOperation({ summary: 'Reactivar inscripción desactivada (soft delete)' })
  @ApiResponse({ status: 200, description: 'Inscripción reactivada' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  @ApiResponse({ status: 400, description: 'La inscripción ya está activa' })
  async reactivarCarrera(
    @Param('id') id: number,
    @Param('usuarioCarreraId') usuarioCarreraId: number,
  ) {
    return this.usuariosService.reactivarCarrera(id, usuarioCarreraId);
  }

  @Delete(':id/carreras/:usuarioCarreraId/definitivo')
  @ApiOperation({
    summary:
      'Eliminar inscripción definitivamente (hard delete) - elimina progreso y planificación',
  })
  @ApiResponse({
    status: 200,
    description: 'Inscripción eliminada definitivamente',
  })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  async eliminarCarreraDefinitivamente(
    @Param('id') id: number,
    @Param('usuarioCarreraId') usuarioCarreraId: number,
  ) {
    await this.usuariosService.eliminarCarreraDefinitivamente(
      id,
      usuarioCarreraId,
    );
    return { message: 'Inscripción eliminada definitivamente' };
  }
}
