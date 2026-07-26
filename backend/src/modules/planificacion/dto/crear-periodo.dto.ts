import {
  IsInt,
  IsEnum,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearPeriodoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  usuarioCarreraId: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  trayectoriaId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  planificacionOrigenId?: number;

  @ApiProperty({ example: 2026 })
  @IsInt()
  anio: number;

  @ApiProperty({ enum: ['Verano', '1er Cuatrimestre', '2do Cuatrimestre'] })
  @IsEnum(['Verano', '1er Cuatrimestre', '2do Cuatrimestre'])
  instancia: string;

  @ApiProperty({ example: 'Variante A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;
}
