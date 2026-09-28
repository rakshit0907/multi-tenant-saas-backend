import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignOrganizationInviteSchema1790610482168 implements MigrationInterface {
  name = 'AlignOrganizationInviteSchema1790610482168';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organization_invite"
      RENAME COLUMN "token" TO "tokenHash"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."organization_invite_role_enum"
      AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'GUEST')
    `);

    await queryRunner.query(`
      ALTER TABLE "organization_invite"
      ADD "role" "public"."organization_invite_role_enum"
      NOT NULL DEFAULT 'MEMBER'
    `);

    await queryRunner.query(`
      ALTER TABLE "organization_invite"
      ALTER COLUMN "tenantId" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organization_invite"
      ALTER COLUMN "tenantId" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "organization_invite"
      DROP COLUMN "role"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."organization_invite_role_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "organization_invite"
      RENAME COLUMN "tokenHash" TO "token"
    `);
  }
}
