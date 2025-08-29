import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppDataSource } from '../data-source';
import { UserModule } from './user/user.module';
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';
import { ShareModule } from './share/share.module';
import { PostsModule } from './posts/posts.module';
import { ReelsModule } from './reels/reels.module';

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
    ReelsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
