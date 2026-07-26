import { IsInt, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CrearTrayectoriaDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  usuarioCarreraId: number;

  @ApiProperty({ example: 'Inteligencia Artificial' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;
}
