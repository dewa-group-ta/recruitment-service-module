import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments
} from "class-validator";

/**
 * memvalidasi tanggal harus di masa depan.
 */
@ValidatorConstraint({ name: "IsFutureDate", async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: Date | string, _args: ValidationArguments): boolean {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    const now = new Date();

    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    return date > now;
  }

  defaultMessage(_args: ValidationArguments): string {
    return "Date must be in the future";
  }
}

/**
 * decorator validasi: tanggal harus di masa depan.
 */
export function IsFutureDate(
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsFutureDateConstraint
    });
  };
}

/**
 * memvalidasi tanggal harus di masa lalu.
 */
@ValidatorConstraint({ name: "IsPastDate", async: false })
export class IsPastDateConstraint implements ValidatorConstraintInterface {
  validate(value: Date | string, _args: ValidationArguments): boolean {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    const now = new Date();

    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    return date < now;
  }

  defaultMessage(_args: ValidationArguments): string {
    return "Date must be in the past";
  }
}

/**
 * decorator validasi: tanggal harus di masa lalu.
 */
export function IsPastDate(
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsPastDateConstraint
    });
  };
}

/**
 * memvalidasi end date harus setelah start date.
 */
@ValidatorConstraint({ name: "IsDateRangeValid", async: false })
export class IsDateRangeValidConstraint
  implements ValidatorConstraintInterface
{
  validate(value: Date | string, _args: ValidationArguments): boolean {
    if (!value) {
      return false;
    }

    const endDate = new Date(value);
    const startDateProperty = _args.constraints[0] || "startDate";
    const startDate = new Date((_args.object as any)[startDateProperty]);

    if (!startDate || isNaN(startDate.getTime())) {
      return false;
    }

    return endDate > startDate;
  }

  defaultMessage(_args: ValidationArguments): string {
    const startDateProperty = _args.constraints[0] || "startDate";
    return `End date must be after ${startDateProperty}`;
  }
}

/**
 * decorator validasi: end date harus setelah start date (nama properti start date bisa dikustom, default "startDate").
 */
export function IsDateRangeValid(
  startDateProperty: string = "startDate",
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions ?? {},
      constraints: [startDateProperty],
      validator: IsDateRangeValidConstraint
    });
  };
}
