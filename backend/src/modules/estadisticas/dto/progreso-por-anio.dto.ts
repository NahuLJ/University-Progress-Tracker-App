import { ApiProperty } from '@nestjs/swagger';

export class ProgresoPorAnioDto {
  @ApiProperty({ example: 1 })
  anio: number;

  @ApiProperty({ example: 12 })
  completadas: number;

  @ApiProperty({ example: 3 })
  enProceso: number;

  @ApiProperty({ example: 5 })
  pendientes: number;
}
