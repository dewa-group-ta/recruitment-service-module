import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments
} from "class-validator";

/**
 * Validator constraint to check if a date is in the future
 * Validates that the provided date is after the current date
 */
@ValidatorConstraint({ name: "IsFutureDate", async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  /**
   * Validates if date is in the future
   * @param value - Date to validate
   * @param args - Validation arguments
   * @returns boolean - True if date is in the future
   */
  validate(value: Date | string, _args: ValidationArguments): boolean {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    const now = new Date();

    // Set time to start of day for comparison
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    return date > now;
  }

  /**
   * Returns default error message
   * @param args - Validation arguments
   * @returns string - Error message
   */
  defaultMessage(_args: ValidationArguments): string {
    return "Date must be in the future";
  }
}

/**
 * Decorator to validate that a date is in the future
 *
 * @param validationOptions - Validation options
 * @returns PropertyDecorator - Validation decorator
 *
 * @example
 * ```typescript
 * export class EventDto {
 *   @IsDate()
 *   @IsFutureDate()
 *   eventDate: Date;
 * }
 * ```
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
 * Validator constraint to check if a date is in the past
 * Validates that the provided date is before the current date
 */
@ValidatorConstraint({ name: "IsPastDate", async: false })
export class IsPastDateConstraint implements ValidatorConstraintInterface {
  /**
   * Validates if date is in the past
   * @param value - Date to validate
   * @param args - Validation arguments
   * @returns boolean - True if date is in the past
   */
  validate(value: Date | string, _args: ValidationArguments): boolean {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    const now = new Date();

    // Set time to start of day for comparison
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    return date < now;
  }

  /**
   * Returns default error message
   * @param args - Validation arguments
   * @returns string - Error message
   */
  defaultMessage(_args: ValidationArguments): string {
    return "Date must be in the past";
  }
}

/**
 * Decorator to validate that a date is in the past
 *
 * @param validationOptions - Validation options
 * @returns PropertyDecorator - Validation decorator
 *
 * @example
 * ```typescript
 * export class ExperienceDto {
 *   @IsDate()
 *   @IsPastDate()
 *   startDate: Date;
 * }
 * ```
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
 * Validator constraint to check if end date is after start date
 * Validates that the end date is chronologically after the start date
 */
@ValidatorConstraint({ name: "IsDateRangeValid", async: false })
export class IsDateRangeValidConstraint
  implements ValidatorConstraintInterface
{
  /**
   * Validates if end date is after start date
   * @param value - End date to validate
   * @param args - Validation arguments containing start date property name
   * @returns boolean - True if end date is after start date
   */
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

  /**
   * Returns default error message
   * @param args - Validation arguments
   * @returns string - Error message
   */
  defaultMessage(_args: ValidationArguments): string {
    const startDateProperty = _args.constraints[0] || "startDate";
    return `End date must be after ${startDateProperty}`;
  }
}

/**
 * Decorator to validate that end date is after start date
 *
 * @param startDateProperty - Name of the start date property (default: 'startDate')
 * @param validationOptions - Validation options
 * @returns PropertyDecorator - Validation decorator
 *
 * @example
 * ```typescript
 * export class JobExperienceDto {
 *   @IsDate()
 *   startDate: Date;
 *
 *   @IsDate()
 *   @IsDateRangeValid('startDate')
 *   endDate: Date;
 * }
 * ```
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
