import { IsInt, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearPeriodoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  usuarioCarreraId: number;

  @ApiProperty({ example: 2026 })
  @IsInt()
  anio: number;

  @ApiProperty({ enum: ['Verano', '1er Cuatrimestre', '2do Cuatrimestre'] })
  @IsEnum(['Verano', '1er Cuatrimestre', '2do Cuatrimestre'])
  instancia: string;

  @ApiPropertyOptional({ example: 'Variante A' })
  @IsOptional()
  @MaxLength(100)
  nombre?: string;
}
