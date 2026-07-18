import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AgregarMateriaPlanDto {
  @ApiProperty({ example: 5 })
  @IsInt()
  materiaId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  anio: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  cuatrimestre: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  orden: number;
}
