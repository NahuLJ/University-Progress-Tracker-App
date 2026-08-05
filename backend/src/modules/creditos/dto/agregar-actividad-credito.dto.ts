import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AgregarActividadCreditoDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  actividadCreditoId: number;
}
