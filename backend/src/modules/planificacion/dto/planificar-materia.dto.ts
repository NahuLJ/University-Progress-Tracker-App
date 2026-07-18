import { IsInt, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlanificarMateriaDto {
  @ApiProperty({ example: 5 })
  @IsInt()
  materiaId: number;

  @ApiProperty({
    example: 2,
    description: 'ID del bloque horario (1=08-10, 2=10-12, ..., 7=20-22)',
  })
  @IsInt()
  bloqueId: number;

  @ApiProperty({
    enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  })
  @IsEnum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'])
  diaSemana: string;
}
