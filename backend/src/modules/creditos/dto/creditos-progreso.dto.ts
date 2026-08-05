import { ApiProperty } from '@nestjs/swagger';

export class CreditosCategoriaProgresoDto {
  @ApiProperty({ example: 1 })
  categoriaCreditoId: number;

  @ApiProperty({ example: 'Seminarios' })
  nombre: string;

  @ApiProperty({ example: 3 })
  minimo: number;

  @ApiProperty({ example: 2 })
  obtenidos: number;

  @ApiProperty({ example: false })
  cumplida: boolean;
}

export class CreditosRequisitoMateriaDto {
  @ApiProperty({ example: 5 })
  materiaId: number;

  @ApiProperty({ example: 'Análisis I' })
  nombre: string;

  @ApiProperty({ example: 'AN1' })
  codigo: string;

  @ApiProperty({ example: true })
  aprobada: boolean;
}

export class CreditosActividadProgresoDto {
  @ApiProperty({ example: 4, nullable: true })
  progresoActividadId: number | null;

  @ApiProperty({ example: 3 })
  actividadCreditoId: number;

  @ApiProperty({ example: 'Taller de liderazgo' })
  nombre: string;

  @ApiProperty({ example: 'Taller presencial', nullable: true })
  descripcion: string | null;

  @ApiProperty({ example: 2 })
  creditos: number;

  @ApiProperty({ example: 1 })
  categoriaCreditoId: number;

  @ApiProperty({ example: 'Seminarios' })
  categoriaNombre: string;

  @ApiProperty({ example: false })
  completada: boolean;

  @ApiProperty({ type: [CreditosRequisitoMateriaDto] })
  requisitos: CreditosRequisitoMateriaDto[];

  @ApiProperty({ example: true })
  requisitosCumplidos: boolean;
}

export class CreditosProgresoResponseDto {
  @ApiProperty({ example: true })
  sistemaCreditos: boolean;

  @ApiProperty({ example: 2 })
  carreraId: number;

  @ApiProperty({ example: 10 })
  totalRequerido: number;

  @ApiProperty({ example: 6 })
  creditosObtenidos: number;

  @ApiProperty({ example: 4 })
  creditosFaltantes: number;

  @ApiProperty({ example: false })
  completado: boolean;

  @ApiProperty({ example: 60 })
  progresoPorcentaje: number;

  @ApiProperty({ type: [CreditosCategoriaProgresoDto] })
  categorias: CreditosCategoriaProgresoDto[];

  @ApiProperty({ type: [CreditosActividadProgresoDto] })
  actividades: CreditosActividadProgresoDto[];
}
