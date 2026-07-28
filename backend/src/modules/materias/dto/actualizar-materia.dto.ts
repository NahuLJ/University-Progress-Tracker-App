import { PartialType } from '@nestjs/swagger';
import { CrearMateriaDto } from './crear-materia.dto';

export class ActualizarMateriaDto extends PartialType(CrearMateriaDto) {}
