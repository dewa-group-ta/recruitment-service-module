import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegistrationCode1781500000000 implements MigrationInterface {
  name = "AddRegistrationCode1781500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // langkah 1: tambah kolom sebagai nullable dulu supaya aman untuk row yang sudah ada
    await queryRunner.query(`
            ALTER TABLE "applications"
            ADD COLUMN "registrationCode" character varying(15)
        `);

    // langkah 2: isi row yang sudah ada dengan kode unik hasil generate,
    // pakai uuid_generate_v4() (dari pgcrypto yang sudah dipakai di project ini)
    // untuk membuat string hex 8 karakter unik per row, diawali REG-
    await queryRunner.query(`
            UPDATE "applications"
            SET "registrationCode" = 'REG-' || upper(substring(replace(uuid_generate_v4()::text, '-', '') from 1 for 8))
            WHERE "registrationCode" IS NULL
        `);

    // langkah 3: tambah constraint NOT NULL setelah semua row punya nilai
    await queryRunner.query(`
            ALTER TABLE "applications"
            ALTER COLUMN "registrationCode" SET NOT NULL
        `);

    // langkah 4: tambah constraint UNIQUE
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
