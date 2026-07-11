import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueApplicantVacancy1780912045208
  implements MigrationInterface
{
  name = "AddUniqueApplicantVacancy1780912045208";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "applications"
            ADD CONSTRAINT "UQ_applications_applicant_vacancy"
            UNIQUE ("applicant_id", "vacancy_id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "applications"
            DROP CONSTRAINT "UQ_applications_applicant_vacancy"
        `);
  }
}
