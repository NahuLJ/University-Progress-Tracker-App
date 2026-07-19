import { ApiProperty } from '@nestjs/swagger';

export class CarreraResumenDto {
  @ApiProperty({ example: 1 })
  usuarioCarreraId: number;

  @ApiProperty({
    type: Object,
    example: { carreraId: 1, nombre: 'Ingeniería en Sistemas' },
  })
  carrera: {
    carreraId: number;
    nombre: string;
  };

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: 18 })
  materiasCompletadas: number;

  @ApiProperty({ example: 35 })
  materiasTotales: number;

  @ApiProperty({ example: 51.4 })
  progresoPorcentaje: number;

  @ApiProperty({ example: 7.83, nullable: true })
  promedioGeneral: number | null;
}
