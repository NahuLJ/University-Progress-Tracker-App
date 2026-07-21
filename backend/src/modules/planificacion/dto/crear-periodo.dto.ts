import { IsInt, IsEnum, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ example: 'Variante A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;
}
