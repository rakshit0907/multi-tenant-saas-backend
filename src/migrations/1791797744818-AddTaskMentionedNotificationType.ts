import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskMentionedNotificationType1791797744818 implements MigrationInterface {
  name = 'AddTaskMentionedNotificationType1791797744818';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."notification_type_enum"
      ADD VALUE IF NOT EXISTS 'TASK_MENTIONED'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "notification"
      WHERE "type" = 'TASK_MENTIONED'
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."notification_type_enum"
      RENAME TO "notification_type_enum_old"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."notification_type_enum" AS ENUM(
        'PROJECT_INVITATION',
        'TASK_ASSIGNED',
        'TASK_COMPLETED',
        'TASK_STATUS_CHANGED',
        'MEMBER_ADDED',
        'MEMBER_REMOVED',
        'WORKSPACE_INVITATION'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "notification"
      ALTER COLUMN "type"
      TYPE "public"."notification_type_enum"
      USING "type"::text::"public"."notification_type_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."notification_type_enum_old"
    `);
  }
}
