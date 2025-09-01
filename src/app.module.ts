import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppDataSource } from '../data-source';
import { UserModule } from './modules/users/user.module';
import { LikeModule } from './modules/likes/like.module';
import { CommentModule } from './modules/comments/comment.module';
import { ShareModule } from './modules/share/share.module';
import { PostsModule } from './modules/posts/posts.module';
import { ReelsModule } from './modules/reels/reels.module';
import { SearchModule } from './search/search.module';

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
    UserModule,
    LikeModule,
    CommentModule,
    ShareModule,
    PostsModule,
    ReelsModule,
    SearchModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
