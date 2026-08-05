import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsArray,
  ArrayUnique,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActualizarActividadCreditoDto {
  @ApiProperty({ required: false, example: 'Taller de liderazgo' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre?: string;

  @ApiProperty({ required: false, example: 'Taller presencial' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @ApiProperty({ required: false, example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  creditos?: number;

  @ApiProperty({
    required: false,
    type: 'array',
    items: { type: 'number' },
    example: [1, 5],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  materiasRequeridas?: number[];
}
