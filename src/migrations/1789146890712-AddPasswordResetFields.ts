import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetFields1789146890712 implements MigrationInterface {
    name = 'AddPasswordResetFields1789146890712'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "passwordResetToken" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "passwordResetExpiresAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "passwordResetExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "passwordResetToken"`);
    }

}
