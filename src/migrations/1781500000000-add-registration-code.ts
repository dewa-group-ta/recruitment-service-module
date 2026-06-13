import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegistrationCode1781500000000 implements MigrationInterface {
    name = 'AddRegistrationCode1781500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Add column as nullable to handle existing rows safely
        await queryRunner.query(`
            ALTER TABLE "applications"
            ADD COLUMN "registrationCode" character varying(15)
        `);

        // Step 2: Populate existing rows with a unique generated code
        // Uses uuid_generate_v4() (available via pgcrypto already used in this project)
        // to generate a unique 8-char hex string per row, prefixed with REG-
        await queryRunner.query(`
            UPDATE "applications"
            SET "registrationCode" = 'REG-' || upper(substring(replace(uuid_generate_v4()::text, '-', '') from 1 for 8))
            WHERE "registrationCode" IS NULL
        `);

        // Step 3: Add NOT NULL constraint now that all rows have values
        await queryRunner.query(`
            ALTER TABLE "applications"
            ALTER COLUMN "registrationCode" SET NOT NULL
        `);

        // Step 4: Add UNIQUE constraint
        await queryRunner.query(`
            ALTER TABLE "applications"
            ADD CONSTRAINT "UQ_applications_registration_code" UNIQUE ("registrationCode")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "applications"
            DROP CONSTRAINT "UQ_applications_registration_code"
        `);

        await queryRunner.query(`
            ALTER TABLE "applications"
            DROP COLUMN "registrationCode"
        `);
    }
}
