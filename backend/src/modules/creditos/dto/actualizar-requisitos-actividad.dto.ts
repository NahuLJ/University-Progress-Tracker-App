import { IsArray, ArrayUnique, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActualizarRequisitosActividadDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'number' },
    example: [1, 5],
  })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  materiasRequeridas: number[];
}
