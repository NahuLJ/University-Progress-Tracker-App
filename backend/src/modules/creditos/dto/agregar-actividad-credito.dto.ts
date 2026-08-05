import { IsInt, Min, IsOptional, IsArray, ArrayUnique } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AgregarActividadCreditoDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  actividadCreditoId: number;

  @ApiProperty({
    required: false,
    type: 'array',
    items: { type: 'number' },
    example: [1, 5],
    description:
      'Materias requisito de esta actividad para esta carrera (por carrera, no globales)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  materiasRequeridas?: number[];
}
