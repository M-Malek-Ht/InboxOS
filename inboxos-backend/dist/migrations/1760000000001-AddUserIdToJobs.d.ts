import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddUserIdToJobs1760000000001 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
