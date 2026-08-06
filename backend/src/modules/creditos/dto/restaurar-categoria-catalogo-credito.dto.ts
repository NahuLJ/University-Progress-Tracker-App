import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RestaurarCategoriaCatalogoCreditoDto {
  @ApiProperty({
    required: false,
    example: true,
    description:
      'Si es true, también reactiva las actividades inactivas de la categoría',
  })
  @IsOptional()
  @IsBoolean()
  restaurarActividades?: boolean;
}
