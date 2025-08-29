import { MigrationInterface, QueryRunner } from "typeorm";

export class TableName1756450730987 implements MigrationInterface {
    name = 'TableName1756450730987'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "share" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" integer NOT NULL, "post_id" integer NOT NULL, "sharedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_67a2b28d2cff31834bc2aa1ed7c" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "share"`);
    }

}
