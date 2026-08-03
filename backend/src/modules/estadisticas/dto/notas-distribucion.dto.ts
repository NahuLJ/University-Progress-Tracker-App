import { ApiProperty } from '@nestjs/swagger';

export class NotasDistribucionDto {
  @ApiProperty({ example: 7.83 })
  promedioGeneral: number;

  @ApiProperty({ example: 18 })
  materiasConNota: number;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        rango: { type: 'string' },
        cantidad: { type: 'number' },
      },
    },
    example: [
      { rango: '4-5', cantidad: 1 },
      { rango: '7', cantidad: 5 },
      { rango: '10', cantidad: 2 },
    ],
  })
  rangos: { rango: string; cantidad: number }[];
}
