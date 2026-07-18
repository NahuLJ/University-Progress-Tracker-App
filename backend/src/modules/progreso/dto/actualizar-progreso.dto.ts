import { IsEnum, IsInt, Min, Max, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarProgresoDto {
  @ApiProperty({ enum: ['Pendiente', 'En Proceso', 'Completada'] })
  @IsEnum(['Pendiente', 'En Proceso', 'Completada'])
  estado: string;

  @ApiPropertyOptional({
    description: 'Obligatorio (4-10) cuando estado = Completada',
  })
  @ValidateIf((o: ActualizarProgresoDto) => o.estado === 'Completada')
  @IsInt()
  @Min(4)
  @Max(10)
  nota?: number;

  @ApiPropertyOptional({
    enum: ['Final', 'Promocion'],
    description: 'Obligatorio cuando estado = Completada',
  })
  @ValidateIf((o: ActualizarProgresoDto) => o.estado === 'Completada')
  @IsEnum(['Final', 'Promocion'])
  tipoAprobacion?: string;
}
