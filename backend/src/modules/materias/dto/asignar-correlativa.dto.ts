import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AsignarCorrelativaDto {
  @ApiProperty({
    example: 3,
    description: 'ID de la materia que actúa como correlativa (requisito)',
  })
  @IsInt()
  materiaCorrelativaId: number;

  @ApiProperty({
    example: 1,
    description: 'ID de la carrera a la que aplica la correlativa',
  })
  @IsInt()
  carreraId: number;
}
