import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddUserIdToJobs1760000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const jobsTable = await queryRunner.getTable('jobs');
    if (jobsTable && !jobsTable.findColumnByName('userId')) {
      await queryRunner.addColumn(
        'jobs',
        new TableColumn({
          name: 'userId',
          type: 'uuid',
          isNullable: true,
        }),
      );

      await queryRunner.createIndex(
        'jobs',
        new TableIndex({
          name: 'IDX_jobs_userId',
          columnNames: ['userId'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const jobsTable = await queryRunner.getTable('jobs');
    if (jobsTable?.indices.some((index) => index.name === 'IDX_jobs_userId')) {
      await queryRunner.dropIndex('jobs', 'IDX_jobs_userId');
    }
    if (jobsTable?.findColumnByName('userId')) {
      await queryRunner.dropColumn('jobs', 'userId');
    }
  }
}
