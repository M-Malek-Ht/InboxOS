"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUserOwnershipToEmailsAndDrafts1760000000000 = void 0;
const typeorm_1 = require("typeorm");
class AddUserOwnershipToEmailsAndDrafts1760000000000 {
    async up(queryRunner) {
        const emailsTable = await queryRunner.getTable('emails');
        if (emailsTable && !emailsTable.findColumnByName('userId')) {
            await queryRunner.addColumn('emails', new typeorm_1.TableColumn({
                name: 'userId',
                type: 'uuid',
                isNullable: true,
            }));
            await queryRunner.createIndex('emails', new typeorm_1.TableIndex({
                name: 'IDX_emails_userId',
                columnNames: ['userId'],
            }));
        }
        const draftsTable = await queryRunner.getTable('drafts');
        if (draftsTable && !draftsTable.findColumnByName('userId')) {
            await queryRunner.addColumn('drafts', new typeorm_1.TableColumn({
                name: 'userId',
                type: 'uuid',
                isNullable: true,
            }));
            await queryRunner.createIndex('drafts', new typeorm_1.TableIndex({
                name: 'IDX_drafts_userId',
                columnNames: ['userId'],
            }));
        }
    }
    async down(queryRunner) {
        const draftsTable = await queryRunner.getTable('drafts');
        if (draftsTable?.indices.some((index) => index.name === 'IDX_drafts_userId')) {
            await queryRunner.dropIndex('drafts', 'IDX_drafts_userId');
        }
        if (draftsTable?.findColumnByName('userId')) {
            await queryRunner.dropColumn('drafts', 'userId');
        }
        const emailsTable = await queryRunner.getTable('emails');
        if (emailsTable?.indices.some((index) => index.name === 'IDX_emails_userId')) {
            await queryRunner.dropIndex('emails', 'IDX_emails_userId');
        }
        if (emailsTable?.findColumnByName('userId')) {
            await queryRunner.dropColumn('emails', 'userId');
        }
    }
}
exports.AddUserOwnershipToEmailsAndDrafts1760000000000 = AddUserOwnershipToEmailsAndDrafts1760000000000;
//# sourceMappingURL=1760000000000-AddUserOwnershipToEmailsAndDrafts.js.map