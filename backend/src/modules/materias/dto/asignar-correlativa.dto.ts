import { IsInt, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AsignarCorrelativaDto {
  @ApiProperty({
    example: 3,
    description: 'ID de la materia que actúa como correlativa (requisito)',
  })
  @IsInt()
  materiaCorrelativaId: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID de la carrera (opcional). Si se provee, la correlativa aplica solo a esa carrera',
  })
  @IsOptional()
  @IsInt()
  carreraId?: number;
}
