import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments
} from "class-validator";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Vacancy } from "../../modules/vacancies/entities/vacancy.entity";
import { JobStatus } from "../enums/job-status.enum";

/**
 * memvalidasi vacancy id ada di database dan statusnya published.
 */
@ValidatorConstraint({ name: "VacancyExists", async: true })
@Injectable()
export class VacancyExistsConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Vacancy)
    private readonly vacancyRepository: Repository<Vacancy>
  ) {}

  async validate(value: string, _args: ValidationArguments): Promise<boolean> {
    if (!value) {
      return false;
    }

    try {
      const vacancy = await this.vacancyRepository.findOne({
        where: { id: value }
      });

      if (!vacancy) {
        return false;
      }

      // hanya vacancy berstatus published yang bisa menerima lamaran
      return vacancy.status === JobStatus.PUBLISHED;
    } catch (_error) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return `Vacancy with ID '${args.value}' does not exist or is not available for applications`;
  }
}

/**
 * decorator validasi: vacancy id harus ada dan berstatus published.
 */
export function VacancyExists(
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions ?? {},
      constraints: [],
      validator: VacancyExistsConstraint
    });
  };
}
