import { MigrationInterface, QueryRunner } from "typeorm";

export class TableName1764154884187 implements MigrationInterface {
    name = 'TableName1764154884187'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chats" ("chat_id" SERIAL NOT NULL, "message_text" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_for" json, "session_id" integer, "sender_id" uuid, CONSTRAINT "PK_cb573d310bde330521e7715db2a" PRIMARY KEY ("chat_id"))`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_5d477781ba9850556f4e50a446f" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("session_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_ed49245ae87902459011243d69a" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_ed49245ae87902459011243d69a"`);
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_5d477781ba9850556f4e50a446f"`);
        await queryRunner.query(`DROP TABLE "chats"`);
    }

}
