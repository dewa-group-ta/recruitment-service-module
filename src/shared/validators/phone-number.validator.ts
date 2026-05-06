import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments
} from "class-validator";

/**
 * Validator constraint for Indonesian phone number format
 * Validates phone numbers in Indonesian format (+62xxxxxxxxxx)
 */
@ValidatorConstraint({ name: "IsIndonesianPhoneNumber", async: false })
export class IsIndonesianPhoneNumberConstraint
  implements ValidatorConstraintInterface
{
  /**
   * Validates Indonesian phone number format
   * @param value - Phone number to validate
   * @param args - Validation arguments
   * @returns boolean - True if phone number is valid
   */
  validate(value: string, _args: ValidationArguments): boolean {
    if (!value || typeof value !== "string") {
      return false;
    }

    // Indonesian phone number regex patterns
    const patterns = [
      /^\+62[0-9]{9,13}$/, // +62xxxxxxxxxx (9-13 digits after +62)
      /^62[0-9]{9,13}$/, // 62xxxxxxxxxx (without +)
      /^0[0-9]{9,12}$/ // 0xxxxxxxxxx (local format)
    ];

    return patterns.some((pattern) => pattern.test(value));
  }

  /**
   * Returns default error message
   * @param args - Validation arguments
   * @returns string - Error message
   */
  defaultMessage(_args: ValidationArguments): string {
    return "Phone number must be a valid Indonesian phone number format (+62xxxxxxxxxx, 62xxxxxxxxxx, or 0xxxxxxxxxx)";
  }
}

/**
 * Decorator to validate Indonesian phone number format
 *
 * @param validationOptions - Validation options
 * @returns PropertyDecorator - Validation decorator
 *
 * @example
 * ```typescript
 * export class ContactDto {
 *   @IsString()
 *   @IsIndonesianPhoneNumber()
 *   phone: string;
 * }
 * ```
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
 * Validator constraint for international phone number format
 * Validates phone numbers in international format
 */
@ValidatorConstraint({ name: "IsInternationalPhoneNumber", async: false })
export class IsInternationalPhoneNumberConstraint
  implements ValidatorConstraintInterface
{
  /**
   * Validates international phone number format
   * @param value - Phone number to validate
   * @param args - Validation arguments
   * @returns boolean - True if phone number is valid
   */
  validate(value: string, _args: ValidationArguments): boolean {
    if (!value || typeof value !== "string") {
      return false;
    }

    // International phone number regex (E.164 format)
    const internationalPattern = /^\+[1-9]\d{1,14}$/;

    return internationalPattern.test(value);
  }

  /**
   * Returns default error message
   * @param args - Validation arguments
   * @returns string - Error message
   */
  defaultMessage(_args: ValidationArguments): string {
    return "Phone number must be in international format (+[country code][number])";
  }
}

/**
 * Decorator to validate international phone number format
 *
 * @param validationOptions - Validation options
 * @returns PropertyDecorator - Validation decorator
 *
 * @example
 * ```typescript
 * export class ContactDto {
 *   @IsString()
 *   @IsInternationalPhoneNumber()
 *   phone: string;
 * }
 * ```
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
