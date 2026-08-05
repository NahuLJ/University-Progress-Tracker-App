import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActualizarCategoriaCreditoDto {
  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(0)
  minimoCreditos: number;
}
