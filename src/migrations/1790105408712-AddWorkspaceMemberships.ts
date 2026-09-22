import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkspaceMemberships1790105408712 implements MigrationInterface {
  name = 'AddWorkspaceMemberships1790105408712';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."workspace_member_role_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'GUEST')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_member" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."workspace_member_role_enum" NOT NULL DEFAULT 'MEMBER', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "tenantId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "UQ_eef9c196b9fc675801e14098cd4" UNIQUE ("tenantId", "userId"), CONSTRAINT "PK_a3a35f64bf30517010551467c6e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_68b2c9907ffbb00e1babb3bdc37" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_03ce416ae83c188274dec61205c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspace_member" DROP CONSTRAINT "FK_03ce416ae83c188274dec61205c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_member" DROP CONSTRAINT "FK_68b2c9907ffbb00e1babb3bdc37"`,
    );
    await queryRunner.query(`DROP TABLE "workspace_member"`);
    await queryRunner.query(`DROP TYPE "public"."workspace_member_role_enum"`);
  }
}
