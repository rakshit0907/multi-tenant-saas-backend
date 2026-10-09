import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkspaceNotificationSupport1791556750874 implements MigrationInterface {
  name = 'AddWorkspaceNotificationSupport1791556750874';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notification" ADD "tenantId" uuid`);
    await queryRunner.query(
      `ALTER TYPE "public"."notification_type_enum" RENAME TO "notification_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_type_enum" AS ENUM('PROJECT_INVITATION', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'TASK_STATUS_CHANGED', 'MEMBER_ADDED', 'MEMBER_REMOVED', 'WORKSPACE_INVITATION')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum" USING "type"::"text"::"public"."notification_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notification_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "notification" ADD CONSTRAINT "FK_734235b45e4310eb80816139bcf" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification" DROP CONSTRAINT "FK_734235b45e4310eb80816139bcf"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_type_enum_old" AS ENUM('PROJECT_INVITATION', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'TASK_STATUS_CHANGED', 'MEMBER_ADDED', 'MEMBER_REMOVED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum_old" USING "type"::"text"::"public"."notification_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."notification_type_enum_old" RENAME TO "notification_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" DROP COLUMN "tenantId"`,
    );
  }
}
