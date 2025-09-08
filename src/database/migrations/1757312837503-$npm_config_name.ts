import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1757312837503 implements MigrationInterface {
    name = ' $npmConfigName1757312837503'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_star_enum" AS ENUM('0', '1', '2', '3')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userName" character varying NOT NULL, "email" character varying, "mobileNumber" character varying NOT NULL, "password" character varying NOT NULL, "paid" boolean NOT NULL DEFAULT false, "role" character varying NOT NULL DEFAULT 'user', "star" "public"."user_star_enum" NOT NULL DEFAULT '0', CONSTRAINT "UQ_da5934070b5f2726ebfd3122c80" UNIQUE ("userName"), CONSTRAINT "UQ_3a6f6a955e65852415ee7bbf1ec" UNIQUE ("mobileNumber"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_star_enum"`);
    }

}
