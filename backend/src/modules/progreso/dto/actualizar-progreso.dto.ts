import { IsEnum, IsInt, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarProgresoDto {
  @ApiProperty({ enum: ['Pendiente', 'En Proceso', 'Completada'] })
  @IsEnum(['Pendiente', 'En Proceso', 'Completada'])
  estado: string;

  @ApiPropertyOptional({
    description: 'Obligatorio cuando estado = Completada',
  })
  @ValidateIf((o: ActualizarProgresoDto) => o.estado === 'Completada')
  @IsInt()
  nota?: number;

  @ApiPropertyOptional({
    enum: ['Final', 'Promocion'],
    description: 'Obligatorio cuando estado = Completada',
  })
  @ValidateIf((o: ActualizarProgresoDto) => o.estado === 'Completada')
  @IsEnum(['Final', 'Promocion'])
  tipoAprobacion?: string;
}
