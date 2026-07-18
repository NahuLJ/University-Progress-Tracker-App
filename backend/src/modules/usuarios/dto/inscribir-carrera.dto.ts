import { IsInt, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InscribirCarreraDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  carreraId: number;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  fechaInicio: string;
}
