import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppDataSource } from "../data-source";
import { BullModule } from "@nestjs/bull";

import { AuthModule } from "./modules/auth/auth.module";
import { BookmarkModule } from "./modules/bookmark/bookmark.module";
import { ChatModule } from "./modules/chat/chat.module";
import { CommentModule } from "./modules/comments/comments.module";
import { FollowModule } from "./modules/follows/follow.module";
import { LikeModule } from "./modules/likes/like.module";
import { ShareModule } from "./modules/share/share.module";
import { StreamModule } from "./modules/stream/stream.module";
import { TokenModule } from "./modules/tokens/token.module";
import { UploadModule } from "./modules/upload/upload.module";
import { UserProfileModule } from "./modules/users/user.module";
import { ViewModule } from "./modules/views/view.module";
import { SharedModule } from "src/modules/shared/shared.module";
import { ReportModule } from "./modules/reports/report.module";
import { StoryDeleteModule } from "./modules/stream/story-delete.module";
import { Bookmark } from "./modules/bookmark/entities/bookmark.entity";
import { Comment } from "./modules/comments/entities/comment.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    /* 🔥 LOCAL REDIS (STABLE CONFIG) */
    BullModule.forRoot({
      redis: {
        host: "127.0.0.1",
        port: 6379,
        keyPrefix: "testing",
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      },
    }),
    // migration and entity automate
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
})
export class AppModule {}
