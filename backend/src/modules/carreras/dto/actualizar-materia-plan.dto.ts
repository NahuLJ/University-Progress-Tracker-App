import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActualizarMateriaPlanDto {
  @ApiProperty({
    example: 2,
    description: 'Nuevo año (opcional, al menos un campo requerido)',
  })
  @IsInt()
  @Min(1)
  @Max(10)
  anio?: number;

  @ApiProperty({
    example: 1,
    description: 'Nuevo cuatrimestre (opcional, al menos un campo requerido)',
  })
  @IsInt()
  @Min(1)
  @Max(2)
  cuatrimestre?: number;

  @ApiProperty({
    example: 3,
    description:
      'Nuevo orden/nro dentro del cuatrimestre (opcional, al menos un campo requerido)',
  })
  @IsInt()
  @Min(1)
  orden?: number;
}
