import { IsBoolean, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActualizarSistemaCreditosDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  creditosHabilitado: boolean;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalCreditos?: number;
}
