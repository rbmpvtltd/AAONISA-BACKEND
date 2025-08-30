import { MigrationInterface, QueryRunner } from "typeorm";

export class TableName1756366499308 implements MigrationInterface {
    name = 'TableName1756366499308'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userName" character varying NOT NULL, "email" character varying, "mobileNumber" character varying NOT NULL, "password" character varying NOT NULL, "paid" boolean NOT NULL DEFAULT false, "role" character varying NOT NULL DEFAULT 'user', "star" character varying NOT NULL DEFAULT 'none', CONSTRAINT "UQ_da5934070b5f2726ebfd3122c80" UNIQUE ("userName"), CONSTRAINT "UQ_3a6f6a955e65852415ee7bbf1ec" UNIQUE ("mobileNumber"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
