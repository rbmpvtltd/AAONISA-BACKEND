import { MigrationInterface, QueryRunner } from "typeorm";

export class TableName1760079512514 implements MigrationInterface {
    name = 'TableName1760079512514'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_profile" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "ProfilePicture" character varying DEFAULT '', "bio" character varying DEFAULT '', "name" character varying DEFAULT '', "url" character varying DEFAULT '', "paid" boolean NOT NULL DEFAULT false, "role" character varying NOT NULL DEFAULT 'user', "star" "public"."user_profile_star_enum" NOT NULL DEFAULT '0', CONSTRAINT "UQ_eee360f3bff24af1b6890765201" UNIQUE ("user_id"), CONSTRAINT "REL_eee360f3bff24af1b689076520" UNIQUE ("user_id"), CONSTRAINT "PK_f44d0cd18cfd80b0fed7806c3b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD CONSTRAINT "FK_eee360f3bff24af1b6890765201" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP CONSTRAINT "FK_eee360f3bff24af1b6890765201"`);
        await queryRunner.query(`DROP TABLE "user_profile"`);
    }

}
