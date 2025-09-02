import { MigrationInterface, QueryRunner } from "typeorm";

export class TableName1756797430199 implements MigrationInterface {
    name = 'TableName1756797430199'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "accessToken" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "accessToken"`);
    }

}
