import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActualizarCategoriaCatalogoCreditoDto {
  @ApiProperty({ required: false, example: 'Seminarios' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre?: string;

  @ApiProperty({ required: false, example: 'Actividades de formación' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;
}
