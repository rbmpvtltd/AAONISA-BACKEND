import { MigrationInterface, QueryRunner } from "typeorm";

export class TableName1760011586741 implements MigrationInterface {
    name = 'TableName1760011586741'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "follows" ("follow_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "followerId" uuid, "followingId" uuid, CONSTRAINT "UQ_105079775692df1f8799ed0fac8" UNIQUE ("followerId", "followingId"), CONSTRAINT "PK_216b46abae15bf5368d90a1116a" PRIMARY KEY ("follow_id"))`);
        await queryRunner.query(`CREATE TABLE "audio" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "category" character varying NOT NULL, "author" character varying NOT NULL, CONSTRAINT "PK_dbb3222220cebc1deb5a2988062" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TABLE "video" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "caption" character varying, "hashtags" text NOT NULL, "videoUrl" character varying NOT NULL, "type" "public"."video_type_enum" NOT NULL, "audio_trim_from" character varying, "audio_trim_to" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "archived" boolean NOT NULL DEFAULT false, "userIdId" uuid, "audioUuid" uuid, CONSTRAINT "PK_d80bea611910b0495fa043fe64c" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TABLE "likes" ("like_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "reelUuid" uuid, "userId" uuid, CONSTRAINT "UQ_436f59d019b1b45f2f35794ce76" UNIQUE ("userId", "reelUuid"), CONSTRAINT "PK_4b698ab917e6a07411bb250e597" PRIMARY KEY ("like_id"))`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."notification_type_enum" NOT NULL, "message" text, "referenceId" uuid, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "recipientId" uuid, "senderId" uuid, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_profile" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "ProfilePicture" character varying DEFAULT '', "bio" character varying DEFAULT '', "name" character varying DEFAULT '', "url" character varying DEFAULT '', "paid" boolean NOT NULL DEFAULT false, "role" character varying NOT NULL DEFAULT 'user', "star" "public"."user_profile_star_enum" NOT NULL DEFAULT '0', CONSTRAINT "UQ_eee360f3bff24af1b6890765201" UNIQUE ("user_id"), CONSTRAINT "REL_eee360f3bff24af1b689076520" UNIQUE ("user_id"), CONSTRAINT "PK_f44d0cd18cfd80b0fed7806c3b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "email" character varying, "phone_no" character varying, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "refreshToken" text, "resetToken" text, "resetTokenExpiry" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_e84ed8eafd2812aaf53a33064d2" UNIQUE ("phone_no"), CONSTRAINT "CHK_41d91c86726166da8af76b75b7" CHECK ("email" IS NOT NULL OR "phone_no" IS NOT NULL), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "views" ("view_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "reelUuid" uuid, CONSTRAINT "UQ_3f55d3b02734107e13db5ea22ee" UNIQUE ("userId", "reelUuid"), CONSTRAINT "PK_fcc7ae614addd3b3fc03dd22d21" PRIMARY KEY ("view_id"))`);
        await queryRunner.query(`CREATE TABLE "shares" ("share_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reel_id" uuid NOT NULL, "user_id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_561becd0e5f2403c623466c7ae6" UNIQUE ("user_id", "reel_id"), CONSTRAINT "PK_331c68d8b4c85f04c290633f576" PRIMARY KEY ("share_id"))`);
        await queryRunner.query(`CREATE TABLE "otp" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying, "email" character varying, "phone_no" character varying, "code" character varying(6) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_32556d9d7b22031d7d0e1fd6723" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "video_mentions_users" ("videoUuid" uuid NOT NULL, "usersId" uuid NOT NULL, CONSTRAINT "PK_5e4ba84731a1f68dd8a90e402a9" PRIMARY KEY ("videoUuid", "usersId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_91df686c1a7cf8e715dfbf1e27" ON "video_mentions_users" ("videoUuid") `);
        await queryRunner.query(`CREATE INDEX "IDX_c4000d356708cf16c3637ff160" ON "video_mentions_users" ("usersId") `);
        await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "FK_fdb91868b03a2040db408a53331" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "FK_ef463dd9a2ce0d673350e36e0fb" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "video" ADD CONSTRAINT "FK_550d619ef9610080a3f9e175edf" FOREIGN KEY ("userIdId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "video" ADD CONSTRAINT "FK_479578acd284d68c48b609768b8" FOREIGN KEY ("audioUuid") REFERENCES "audio"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_d2936a168263a7fd6be1b6d3d45" FOREIGN KEY ("reelUuid") REFERENCES "video"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_ab7cbe7a013ecac5da0a8f88884" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_c0af34102c13c654955a0c5078b" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD CONSTRAINT "FK_eee360f3bff24af1b6890765201" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "views" ADD CONSTRAINT "FK_1a136367d53567a43ba7aae5a7b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "views" ADD CONSTRAINT "FK_ca481eee1cdb2daeb68d5faf532" FOREIGN KEY ("reelUuid") REFERENCES "video"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "video_mentions_users" ADD CONSTRAINT "FK_91df686c1a7cf8e715dfbf1e27b" FOREIGN KEY ("videoUuid") REFERENCES "video"("uuid") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "video_mentions_users" ADD CONSTRAINT "FK_c4000d356708cf16c3637ff160e" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "video_mentions_users" DROP CONSTRAINT "FK_c4000d356708cf16c3637ff160e"`);
        await queryRunner.query(`ALTER TABLE "video_mentions_users" DROP CONSTRAINT "FK_91df686c1a7cf8e715dfbf1e27b"`);
        await queryRunner.query(`ALTER TABLE "views" DROP CONSTRAINT "FK_ca481eee1cdb2daeb68d5faf532"`);
        await queryRunner.query(`ALTER TABLE "views" DROP CONSTRAINT "FK_1a136367d53567a43ba7aae5a7b"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP CONSTRAINT "FK_eee360f3bff24af1b6890765201"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_c0af34102c13c654955a0c5078b"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_ab7cbe7a013ecac5da0a8f88884"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_d2936a168263a7fd6be1b6d3d45"`);
        await queryRunner.query(`ALTER TABLE "video" DROP CONSTRAINT "FK_479578acd284d68c48b609768b8"`);
        await queryRunner.query(`ALTER TABLE "video" DROP CONSTRAINT "FK_550d619ef9610080a3f9e175edf"`);
        await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT "FK_ef463dd9a2ce0d673350e36e0fb"`);
        await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT "FK_fdb91868b03a2040db408a53331"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c4000d356708cf16c3637ff160"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_91df686c1a7cf8e715dfbf1e27"`);
        await queryRunner.query(`DROP TABLE "video_mentions_users"`);
        await queryRunner.query(`DROP TABLE "otp"`);
        await queryRunner.query(`DROP TABLE "shares"`);
        await queryRunner.query(`DROP TABLE "views"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "user_profile"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TABLE "likes"`);
        await queryRunner.query(`DROP TABLE "video"`);
        await queryRunner.query(`DROP TABLE "audio"`);
        await queryRunner.query(`DROP TABLE "follows"`);
    }

}
