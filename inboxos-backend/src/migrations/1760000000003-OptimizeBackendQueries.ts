import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptimizeBackendQueries1760000000003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE emails
      ADD COLUMN IF NOT EXISTS "externalId" varchar DEFAULT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_emails_userId_externalId"
      ON emails ("userId", "externalId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_emails_userId_folder_receivedAt"
      ON emails ("userId", "isTrashed", "isSent", "receivedAt" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_drafts_userId_emailId_status"
      ON drafts ("userId", "emailId", "status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_drafts_userId_emailId_status";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_emails_userId_folder_receivedAt";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_emails_userId_externalId";
    `);
    await queryRunner.query(`
      ALTER TABLE emails DROP COLUMN IF EXISTS "externalId";
    `);
  }
}
