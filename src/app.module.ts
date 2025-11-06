import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppDataSource } from '../data-source';
import { UserProfileModule } from './modules/users/user.module';
import { LikeModule } from './modules/likes/like.module';
import { ViewModule } from './modules/views/view.module';
import { ShareModule } from './modules/share/share.module';
import { AuthModule } from './modules/auth/auth.module';
import { StreamModule } from './modules/stream/stream.module';
import { FollowModule } from './modules/follows/follow.module';
import { UploadModule } from './modules/upload/upload.module';
import { Bookmark } from './modules/bookmark/entities/bookmark.entity';
import { AppGateway } from './app.gateway';
import { Comment } from './modules/comments/entities/comment.entity';
import { BookmarkModule } from './modules/bookmark/bookmark.module';
import { ApiOAuth2 } from '@nestjs/swagger';
import { CommentModule } from './modules/comments/comments.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const { entities, migrations, ...rest } = AppDataSource.options;
        return ({
          ...rest,
          autoLoadEntities: true,
        })
      },
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserProfileModule,
    StreamModule,
    FollowModule,
    LikeModule,
    ViewModule,
    ShareModule,
    UploadModule,
    BookmarkModule,
    CommentModule,
    TypeOrmModule.forFeature([Bookmark, Comment]),
  ],
  controllers: [],
  providers: [AppGateway],
  exports: [AppGateway],  // ✅ add this

})

// checking ci/cd
export class AppModule { }
