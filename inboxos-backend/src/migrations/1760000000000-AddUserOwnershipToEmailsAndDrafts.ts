import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddUserOwnershipToEmailsAndDrafts1760000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const emailsTable = await queryRunner.getTable('emails');
    if (emailsTable && !emailsTable.findColumnByName('userId')) {
      await queryRunner.addColumn(
        'emails',
        new TableColumn({
          name: 'userId',
          type: 'uuid',
          isNullable: true,
        }),
      );

      await queryRunner.createIndex(
        'emails',
        new TableIndex({
          name: 'IDX_emails_userId',
          columnNames: ['userId'],
        }),
      );
    }

    const draftsTable = await queryRunner.getTable('drafts');
    if (draftsTable && !draftsTable.findColumnByName('userId')) {
      await queryRunner.addColumn(
        'drafts',
        new TableColumn({
          name: 'userId',
          type: 'uuid',
          isNullable: true,
        }),
      );

      await queryRunner.createIndex(
        'drafts',
        new TableIndex({
          name: 'IDX_drafts_userId',
          columnNames: ['userId'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
