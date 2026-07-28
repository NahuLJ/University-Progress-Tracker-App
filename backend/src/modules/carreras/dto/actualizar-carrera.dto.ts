import { PartialType } from '@nestjs/swagger';
import { CrearCarreraDto } from './crear-carrera.dto';

export class ActualizarCarreraDto extends PartialType(CrearCarreraDto) {}
