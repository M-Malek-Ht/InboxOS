"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnsureJobsUserId1760000000002 = void 0;
class EnsureJobsUserId1760000000002 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE jobs
        ADD COLUMN IF NOT EXISTS "userId" uuid;
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_jobs_userId" ON jobs ("userId");
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_jobs_userId";`);
        await queryRunner.query(`ALTER TABLE jobs DROP COLUMN IF EXISTS "userId";`);
    }
}
exports.EnsureJobsUserId1760000000002 = EnsureJobsUserId1760000000002;
//# sourceMappingURL=1760000000002-EnsureJobsUserId.js.map