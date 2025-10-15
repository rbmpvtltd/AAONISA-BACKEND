import { MigrationInterface, QueryRunner } from "typeorm";

export class TableName1760011060494 implements MigrationInterface {
    name = 'TableName1760011060494'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP CONSTRAINT "UQ_eee360f3bff24af1b6890765201"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD CONSTRAINT "UQ_eee360f3bff24af1b6890765201" UNIQUE ("user_id")`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD CONSTRAINT "FK_eee360f3bff24af1b6890765201" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP CONSTRAINT "FK_eee360f3bff24af1b6890765201"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP CONSTRAINT "UQ_eee360f3bff24af1b6890765201"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "user_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD CONSTRAINT "UQ_eee360f3bff24af1b6890765201" UNIQUE ("user_id")`);
    }

}
