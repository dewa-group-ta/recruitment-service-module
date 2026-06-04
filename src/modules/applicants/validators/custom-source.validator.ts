import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments
} from "class-validator";
import { Injectable } from "@nestjs/common";
import { ApplicantSourceService } from "../services/applicant-source.service";

@ValidatorConstraint({ name: "isCustomSourceRequired", async: true })
@Injectable()
export class IsCustomSourceRequiredConstraint
  implements ValidatorConstraintInterface
{
  constructor(
    private readonly applicantSourceService: ApplicantSourceService
  ) {}

  async validate(
    customSource: string,
    args: ValidationArguments
  ): Promise<boolean> {
    const object = args.object as any;
    const applicantSourceIds = object.applicantSourceIds;

    return await this.applicantSourceService.validateCustomSource(
      customSource,
      applicantSourceIds
    );
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as any;
    const applicantSourceIds = object.applicantSourceIds;

    return this.applicantSourceService.getErrorMessage(applicantSourceIds);
  }
}

export function IsCustomSourceRequired(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCustomSourceRequiredConstraint
    });
  };
}
