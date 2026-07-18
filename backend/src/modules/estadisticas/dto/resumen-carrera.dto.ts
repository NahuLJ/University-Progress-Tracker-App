import { ApiProperty } from '@nestjs/swagger';

export class ResumenResponseDto {
  @ApiProperty({ example: 7.83 })
  promedioGeneral: number;

  @ApiProperty({ example: 18 })
  materiasCompletadas: number;

  @ApiProperty({ example: 5 })
  materiasEnProceso: number;

  @ApiProperty({ example: 12 })
  materiasPendientes: number;

  @ApiProperty({ example: 35 })
  totalMaterias: number;

  @ApiProperty({ example: 144 })
  creditosObtenidos: number;

  @ApiProperty({ example: 280 })
  creditosTotales: number;

  @ApiProperty({ example: 4 })
  cuatrimestresRestantes: number;

  @ApiProperty({ example: 51.4 })
  progresoPorcentaje: number;
}
