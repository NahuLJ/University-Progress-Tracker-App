import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'esMultiplo', async: false })
export class EsMultiploConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'number' || !Number.isFinite(value)) return false;
    const multiplo = args.constraints?.[0] as number | undefined;
    if (
      typeof multiplo !== 'number' ||
      !Number.isFinite(multiplo) ||
      multiplo <= 0
    ) {
      return false;
    }
    return Number.isInteger(value / multiplo);
  }

  defaultMessage(args: ValidationArguments): string {
    return `El valor debe ser múltiplo de ${args.constraints?.[0]}`;
  }
}

export function EsMultiploDe(
  multiplo: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [multiplo],
      validator: EsMultiploConstraint,
    });
  };
}
