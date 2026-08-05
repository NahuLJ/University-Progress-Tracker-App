import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CrearActividadCreditoDto {
  @ApiProperty({ example: 'Taller de liderazgo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({ required: false, example: 'Taller presencial' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  categoriaCreditoId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  creditos: number;
}
