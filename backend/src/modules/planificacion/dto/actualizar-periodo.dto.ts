import {
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarPeriodoDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @IsNumber()
  @Min(2020)
  @Max(2030)
  anio?: number;

  @ApiPropertyOptional({
    enum: ['Verano', '1er Cuatrimestre', '2do Cuatrimestre'],
  })
  @IsOptional()
  @IsEnum(['Verano', '1er Cuatrimestre', '2do Cuatrimestre'])
  instancia?: 'Verano' | '1er Cuatrimestre' | '2do Cuatrimestre';

  @ApiPropertyOptional({ example: 'Variante A' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;
}
