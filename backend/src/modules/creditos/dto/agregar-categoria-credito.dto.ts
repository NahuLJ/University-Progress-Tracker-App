import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AgregarCategoriaCreditoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  categoriaCreditoId: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(0)
  minimoCreditos: number;
}
