import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTaskCompletedColumn1792070248795
  implements MigrationInterface
{
  name = 'RemoveTaskCompletedColumn1792070248795';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task" DROP COLUMN "completed"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task" ADD "completed" boolean NOT NULL DEFAULT false`,
    );
  }
}