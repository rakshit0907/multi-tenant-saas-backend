import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectMetadata1790020093321 implements MigrationInterface {
  name = 'AddProjectMetadata1790020093321';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" ADD "description" text`);
    await queryRunner.query(
      `CREATE TYPE "public"."project_status_enum" AS ENUM('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "status" "public"."project_status_enum" NOT NULL DEFAULT 'PLANNING'`,
    );
    await queryRunner.query(`ALTER TABLE "project" ADD "startDate" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "project" ADD "dueDate" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "dueDate"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "startDate"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."project_status_enum"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "description"`);
  }
}
