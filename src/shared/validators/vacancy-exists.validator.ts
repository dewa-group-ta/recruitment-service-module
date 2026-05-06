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
 * Validator constraint to check if vacancy exists and is active
 * Validates that the vacancy ID exists in the database and the vacancy is in an active state
 */
@ValidatorConstraint({ name: "VacancyExists", async: true })
@Injectable()
export class VacancyExistsConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Vacancy)
    private readonly vacancyRepository: Repository<Vacancy>
  ) {}

  /**
   * Validates if vacancy exists and is active
   * @param value - Vacancy ID to validate
   * @param args - Validation arguments
   * @returns Promise<boolean> - True if vacancy exists and is active
   */
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

      // Check if vacancy is in an active status (not closed or archived)
      const activeStatuses = [
        JobStatus.DRAFT,
        JobStatus.PUBLISHED,
        JobStatus.PAUSED
      ];
      return activeStatuses.includes(vacancy.status);
    } catch (_error) {
      return false;
    }
  }

  /**
   * Returns default error message
   * @param args - Validation arguments
   * @returns string - Error message
   */
  defaultMessage(args: ValidationArguments): string {
    return `Vacancy with ID '${args.value}' does not exist or is not available for applications`;
  }
}

/**
 * Decorator to validate that a vacancy exists and is active
 *
 * @param validationOptions - Validation options
 * @returns PropertyDecorator - Validation decorator
 *
 * @example
 * ```typescript
 * export class ApplyForJobDto {
 *   @IsUUID()
 *   @VacancyExists()
 *   vacancyId: string;
 * }
 * ```
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
