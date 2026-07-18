import { ApiProperty } from '@nestjs/swagger';

export class DistribucionEstadosDto {
  @ApiProperty({ example: 'Pendiente' })
  estado: string;

  @ApiProperty({ example: 12 })
  cantidad: number;
}
