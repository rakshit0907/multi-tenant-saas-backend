import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMilestones1789734287543 implements MigrationInterface {
    name = 'AddMilestones1789734287543'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."milestone_status_enum" AS ENUM('ACTIVE', 'COMPLETED')`);
        await queryRunner.query(`CREATE TABLE "milestone" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "targetDate" TIMESTAMP, "status" "public"."milestone_status_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "projectId" uuid, CONSTRAINT "PK_f8372abce331f60ba7b33fe23a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "task" ADD "milestoneId" uuid`);
        await queryRunner.query(`ALTER TABLE "milestone" ADD CONSTRAINT "FK_edc28a2e0442554afe5eef2bdcb" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_0b1e6e6f89e39e84933d144890b" FOREIGN KEY ("milestoneId") REFERENCES "milestone"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_0b1e6e6f89e39e84933d144890b"`);
        await queryRunner.query(`ALTER TABLE "milestone" DROP CONSTRAINT "FK_edc28a2e0442554afe5eef2bdcb"`);
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "milestoneId"`);
        await queryRunner.query(`DROP TABLE "milestone"`);
        await queryRunner.query(`DROP TYPE "public"."milestone_status_enum"`);
    }

}
