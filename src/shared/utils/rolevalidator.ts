import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions
} from "class-validator";

export function isTargetValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isRoleTargetValid",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const object = args.object as { target: string };
          if (object.target === "Role" || object.target === "Personal") {
            return typeof value === "string";
          }
          return value === null;
        },
        defaultMessage() {
          return `Both role and userId must be valid strings when target is Role`;
        }
      }
    });
  };
}
