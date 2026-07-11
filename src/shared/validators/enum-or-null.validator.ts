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
    if (value === null || value === undefined) {
      return true;
    }

    if (value === "") {
      return true;
    }

    if (typeof value === "string" && value.trim() === "") {
      return true;
    }

    const [enumObject] = args.constraints;
    if (!enumObject) {
      return false;
    }

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
