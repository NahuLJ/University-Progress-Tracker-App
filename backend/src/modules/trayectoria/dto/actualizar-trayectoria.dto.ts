import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarTrayectoriaDto {
  @ApiPropertyOptional({ example: 'Redes y Comunicaciones' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre?: string;
}
