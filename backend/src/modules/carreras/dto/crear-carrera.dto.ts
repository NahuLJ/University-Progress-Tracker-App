import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearCarreraDto {
  @ApiProperty({ example: 'Ingeniería en Sistemas' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 5.0 })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(10)
  duracionAnios: number;
}
