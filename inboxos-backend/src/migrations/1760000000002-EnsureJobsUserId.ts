import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ensures the `userId` column exists on the `jobs` table.
 * Uses raw SQL with IF NOT EXISTS so it is safe to run multiple times
 * and cannot be blocked by the TypeORM migration-tracking table
 * recording an earlier (possibly failed) attempt under a different name.
 */
export class EnsureJobsUserId1760000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE jobs
        ADD COLUMN IF NOT EXISTS "userId" uuid;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_jobs_userId" ON jobs ("userId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_jobs_userId";`);
    await queryRunner.query(`ALTER TABLE jobs DROP COLUMN IF EXISTS "userId";`);
  }
}
