import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from "class-validator";

@ValidatorConstraint({ name: "isEnumOrNull", async: false })
export class IsEnumOrNullConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    // If value is null or undefined, it's valid
    if (value === null || value === undefined) {
      return true;
    }

    // If value is an empty string, convert to null (valid)
    if (value === "") {
      return true;
    }

    // If value is a string with only whitespace, convert to null (valid)
    if (typeof value === "string" && value.trim() === "") {
      return true;
    }

    // Get the enum from the constraint arguments
    const [enumObject] = args.constraints;
    if (!enumObject) {
      return false;
    }

    // Check if the value is a valid enum value
    const enumValues = Object.values(enumObject);
    return enumValues.includes(value);
  }

  defaultMessage(args: ValidationArguments) {
    const [enumObject] = args.constraints;
    const enumValues = Object.values(enumObject);
    return `${args.property} must be one of the following values: ${enumValues.join(", ")} or null`;
  }
}

export function IsEnumOrNull(
  enumObject: any,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [enumObject],
      validator: IsEnumOrNullConstraint
    });
  };
}
