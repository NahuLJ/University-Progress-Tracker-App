import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CrearProgresoActividadDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  usuarioCarreraId: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  actividadCreditoId: number;
}
