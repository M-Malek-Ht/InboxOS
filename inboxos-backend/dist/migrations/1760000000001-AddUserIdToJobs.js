"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUserIdToJobs1760000000001 = void 0;
const typeorm_1 = require("typeorm");
class AddUserIdToJobs1760000000001 {
    async up(queryRunner) {
        const jobsTable = await queryRunner.getTable('jobs');
        if (jobsTable && !jobsTable.findColumnByName('userId')) {
            await queryRunner.addColumn('jobs', new typeorm_1.TableColumn({
                name: 'userId',
                type: 'uuid',
                isNullable: true,
            }));
            await queryRunner.createIndex('jobs', new typeorm_1.TableIndex({
                name: 'IDX_jobs_userId',
                columnNames: ['userId'],
            }));
        }
    }
    async down(queryRunner) {
        const jobsTable = await queryRunner.getTable('jobs');
        if (jobsTable?.indices.some((index) => index.name === 'IDX_jobs_userId')) {
            await queryRunner.dropIndex('jobs', 'IDX_jobs_userId');
        }
        if (jobsTable?.findColumnByName('userId')) {
            await queryRunner.dropColumn('jobs', 'userId');
        }
    }
}
exports.AddUserIdToJobs1760000000001 = AddUserIdToJobs1760000000001;
//# sourceMappingURL=1760000000001-AddUserIdToJobs.js.map