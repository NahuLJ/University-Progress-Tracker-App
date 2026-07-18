import { ApiProperty } from '@nestjs/swagger';

export class InicializarProgresoDto {
  @ApiProperty({ example: 1 })
  usuarioCarreraId: number;
}
