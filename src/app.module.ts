import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ApiOAuth2 } from "@nestjs/swagger";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppDataSource } from "../data-source";
import { AppGateway } from "./app.gateway";
import { AuthModule } from "./modules/auth/auth.module";
import { BookmarkModule } from "./modules/bookmark/bookmark.module";
import { Bookmark } from "./modules/bookmark/entities/bookmark.entity";
import { ChatModule } from "./modules/chat/chat.module";
import { CommentModule } from "./modules/comments/comments.module";
import { Comment } from "./modules/comments/entities/comment.entity";
import { FollowModule } from "./modules/follows/follow.module";
import { LikeModule } from "./modules/likes/like.module";
import { ShareModule } from "./modules/share/share.module";
import { StreamModule } from "./modules/stream/stream.module";
import { TokenModule } from "./modules/tokens/token.module";
import { UploadModule } from "./modules/upload/upload.module";
import { UserProfileModule } from "./modules/users/user.module";
import { ViewModule } from "./modules/views/view.module";
import { TestController } from "./test/test.controller";
import { SharedModule } from 'src/modules/shared/shared.module'
import { ReportModule } from "./modules/reports/report.module";
import { StoryDeleteModule } from "./modules/stream/story-delete.module";
import { BullModule } from '@nestjs/bull';
@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		BullModule.forRoot({
			redis: {
				host: process.env.REDIS_HOST,
				port: Number(process.env.REDIS_PORT),
				// username: process.env.REDIS_USERNAME,
				password: process.env.REDIS_PASSWORD,
				// tls: {},
				// maxRetriesPerRequest: null,
				// enableReadyCheck: false,
			},
		}),

		TypeOrmModule.forRootAsync({
			useFactory: () => {
				const { entities, migrations, ...rest } = AppDataSource.options;
				return {
					...rest,
					autoLoadEntities: true,
				};
			},
		}),
		ScheduleModule.forRoot(),
		AuthModule,
		SharedModule,
		UserProfileModule,
		StreamModule,
		FollowModule,
		LikeModule,
		ViewModule,
		ShareModule,
		UploadModule,
		BookmarkModule,
		CommentModule,
		TokenModule,
		ChatModule,
		ReportModule,
		StoryDeleteModule,
		TypeOrmModule.forFeature([Bookmark, Comment]),
	],
	controllers: [TestController],
	providers: [],
	exports: [],
})

// checking ci/cd
export class AppModule { }
