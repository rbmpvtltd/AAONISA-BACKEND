import { MigrationInterface, QueryRunner } from "typeorm";

export class TableName1756450432894 implements MigrationInterface {
    name = 'TableName1756450432894'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "share" ADD "user_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "share" ADD "post_id" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "share" DROP COLUMN "post_id"`);
        await queryRunner.query(`ALTER TABLE "share" DROP COLUMN "user_id"`);
    }

}
