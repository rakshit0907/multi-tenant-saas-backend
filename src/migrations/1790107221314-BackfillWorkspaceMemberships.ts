import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillWorkspaceMemberships1790107221314 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "workspace_member" ("tenantId", "userId", "role")
      SELECT
        ranked."tenantId",
        ranked."id",
        CASE
          WHEN ranked."position" = 1
            THEN 'OWNER'::"public"."workspace_member_role_enum"
          ELSE 'MEMBER'::"public"."workspace_member_role_enum"
        END
      FROM (
        SELECT
          u."id",
          u."tenantId",
          ROW_NUMBER() OVER (
            PARTITION BY u."tenantId"
            ORDER BY u."created_at" ASC, u."id" ASC
          ) AS "position"
        FROM "user" u
        WHERE u."tenantId" IS NOT NULL
      ) ranked
      ON CONFLICT ("tenantId", "userId") DO NOTHING
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally non-destructive.
    // Backfilled memberships cannot safely be distinguished from
    // memberships legitimately created after this migration.
  }
}
