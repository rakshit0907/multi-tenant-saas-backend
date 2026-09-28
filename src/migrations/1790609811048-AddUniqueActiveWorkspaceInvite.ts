import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueActiveWorkspaceInvite1790609811048 implements MigrationInterface {
  name = 'AddUniqueActiveWorkspaceInvite1790609811048';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_unique_active_workspace_invite"
      ON "organization_invite" ("tenantId", LOWER("email"))
      WHERE "accepted" = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_unique_active_workspace_invite"
    `);
  }
}
