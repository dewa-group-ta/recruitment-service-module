import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments
} from "class-validator";

/**
 * memvalidasi format nomor telepon indonesia.
 */
@ValidatorConstraint({ name: "IsIndonesianPhoneNumber", async: false })
export class IsIndonesianPhoneNumberConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string, _args: ValidationArguments): boolean {
    if (!value || typeof value !== "string") {
      return false;
    }

    const patterns = [
      /^\+62[0-9]{9,13}$/, // format +62xxxxxxxxxx
      /^62[0-9]{9,13}$/, // format 62xxxxxxxxxx (tanpa +)
      /^0[0-9]{9,12}$/ // format lokal 0xxxxxxxxxx
    ];

    return patterns.some((pattern) => pattern.test(value));
  }

  defaultMessage(_args: ValidationArguments): string {
    return "Phone number must be a valid Indonesian phone number format (+62xxxxxxxxxx, 62xxxxxxxxxx, or 0xxxxxxxxxx)";
  }
}

/**
 * decorator validasi: format nomor telepon indonesia.
 */
export function IsIndonesianPhoneNumber(
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsIndonesianPhoneNumberConstraint
    });
  };
}

/**
 * memvalidasi format nomor telepon internasional (E.164).
 */
@ValidatorConstraint({ name: "IsInternationalPhoneNumber", async: false })
export class IsInternationalPhoneNumberConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string, _args: ValidationArguments): boolean {
    if (!value || typeof value !== "string") {
      return false;
    }

    const internationalPattern = /^\+[1-9]\d{1,14}$/;

    return internationalPattern.test(value);
  }

  defaultMessage(_args: ValidationArguments): string {
    return "Phone number must be in international format (+[country code][number])";
  }
}

/**
 * decorator validasi: format nomor telepon internasional.
 */
export function IsInternationalPhoneNumber(
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions ?? {},
      constraints: [],
      validator: IsInternationalPhoneNumberConstraint
    });
  };
}
