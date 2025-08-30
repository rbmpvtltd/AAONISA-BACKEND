import { MigrationInterface, QueryRunner } from "typeorm";

export class TableName1756377947868 implements MigrationInterface {
    name = 'TableName1756377947868'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "like" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "post_id" integer NOT NULL, CONSTRAINT "UQ_4356ac2f9519c7404a2869f1691" UNIQUE ("user_id"), CONSTRAINT "UQ_d41caa70371e578e2a4791a88ae" UNIQUE ("post_id"), CONSTRAINT "PK_eff3e46d24d416b52a7e0ae4159" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "like"`);
    }

}
