import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1778156765356 implements MigrationInterface {
    name = 'Migration1778156765356'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "application_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "application_id" uuid NOT NULL, "notes" text NOT NULL, "createdBy" character varying(100), "updatedBy" character varying(100), "isPrivate" boolean NOT NULL DEFAULT false, "category" character varying(50), "priority" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_db708de5fa99541ad52a1f907de" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d3769eb65b81f027908bdcd0e1" ON "application_notes" ("application_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "stage_activities" DROP COLUMN "scheduledAt"`);
        await queryRunner.query(`ALTER TABLE "stage_activities" DROP COLUMN "rescheduledAt"`);
        await queryRunner.query(`ALTER TABLE "stage_activities" DROP COLUMN "meetingLink"`);
        await queryRunner.query(`ALTER TABLE "stage_activities" DROP COLUMN "documentUrl"`);
        await queryRunner.query(`ALTER TABLE "stage_activities" DROP COLUMN "documentName"`);
        await queryRunner.query(`CREATE TYPE "public"."stage_activities_status_enum" AS ENUM('pending', 'in_progress', 'done', 'failed')`);
        await queryRunner.query(`ALTER TABLE "stage_activities" ADD "status" "public"."stage_activities_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "stage_activities" DROP COLUMN "score"`);
        await queryRunner.query(`ALTER TABLE "stage_activities" ADD "score" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "stage_activities" ALTER COLUMN "performed_by" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application_notes" ADD CONSTRAINT "FK_1a5375c61bc031bba625c02096d" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_notes" DROP CONSTRAINT "FK_1a5375c61bc031bba625c02096d"`);
        await queryRunner.query(`ALTER TABLE "stage_activities" ALTER COLUMN "performed_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stage_activities" DROP COLUMN "score"`);
        await queryRunner.query(`ALTER TABLE "stage_activities" ADD "score" integer`);
        await queryRunner.query(`ALTER TABLE "stage_activities" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."stage_activities_status_enum"`);
        await queryRunner.query(`ALTER TABLE "stage_activities" ADD "documentName" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "stage_activities" ADD "documentUrl" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "stage_activities" ADD "meetingLink" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "stage_activities" ADD "rescheduledAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "stage_activities" ADD "scheduledAt" TIMESTAMP`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d3769eb65b81f027908bdcd0e1"`);
        await queryRunner.query(`DROP TABLE "application_notes"`);
    }

}
