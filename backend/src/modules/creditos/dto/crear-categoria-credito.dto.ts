import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CrearCategoriaCreditoDto {
  @ApiProperty({ example: 'Seminarios' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({ required: false, example: 'Actividades de formación' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;
}
