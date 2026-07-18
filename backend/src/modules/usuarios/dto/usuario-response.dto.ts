import { ApiProperty } from '@nestjs/swagger';

export class UsuarioResponseDto {
  @ApiProperty({ example: 1 })
  usuarioId: number;

  @ApiProperty({ example: 'Juan Pérez' })
  nombre: string;

  @ApiProperty({ example: 'juan@example.com' })
  email: string;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  fechaRegistro: Date;

  @ApiProperty({ example: true })
  activo: boolean;
}
