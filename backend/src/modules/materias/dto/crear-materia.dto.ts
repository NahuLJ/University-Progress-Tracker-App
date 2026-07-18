import { IsString, IsInt, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearMateriaDto {
  @ApiProperty({ example: 'Álgebra Lineal' })
  @IsString()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({ example: 'MAT102' })
  @IsString()
  @MaxLength(20)
  codigo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 96 })
  @IsInt()
  @Min(1)
  cargaHoraria: number;

  @ApiProperty({ example: 8 })
  @IsInt()
  @Min(1)
  creditos: number;
}
