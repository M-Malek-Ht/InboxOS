"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizeBackendQueries1760000000003 = void 0;
class OptimizeBackendQueries1760000000003 {
    async up(queryRunner) {
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
    async down(queryRunner) {
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
exports.OptimizeBackendQueries1760000000003 = OptimizeBackendQueries1760000000003;
//# sourceMappingURL=1760000000003-OptimizeBackendQueries.js.map