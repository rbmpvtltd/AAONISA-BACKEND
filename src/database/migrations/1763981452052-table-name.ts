import { MigrationInterface, QueryRunner } from "typeorm";

export class TableName1763981452052 implements MigrationInterface {
    name = 'TableName1763981452052'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chats" ("chat_id" SERIAL NOT NULL, "message_text" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "sessionSessionId" integer, "senderId" uuid, CONSTRAINT "PK_cb573d310bde330521e7715db2a" PRIMARY KEY ("chat_id"))`);
        await queryRunner.query(`CREATE TABLE "chat_sessions" ("session_id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user1Id" uuid, "user2Id" uuid, CONSTRAINT "PK_6ccb7b732f5af0bde672165cadf" PRIMARY KEY ("session_id"))`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_2d1c19d121d008d08d8a3bcf221" FOREIGN KEY ("sessionSessionId") REFERENCES "chat_sessions"("session_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_d697f19c9c7778ed773b449ce70" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_sessions" ADD CONSTRAINT "FK_25a3d1f613a878ada3e2383fcc8" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_sessions" ADD CONSTRAINT "FK_44d3b8a849cb98234fe33582e61" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_sessions" DROP CONSTRAINT "FK_44d3b8a849cb98234fe33582e61"`);
        await queryRunner.query(`ALTER TABLE "chat_sessions" DROP CONSTRAINT "FK_25a3d1f613a878ada3e2383fcc8"`);
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_d697f19c9c7778ed773b449ce70"`);
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_2d1c19d121d008d08d8a3bcf221"`);
        await queryRunner.query(`DROP TABLE "chat_sessions"`);
        await queryRunner.query(`DROP TABLE "chats"`);
    }

}
