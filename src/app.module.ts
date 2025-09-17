import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppDataSource } from '../data-source';
import { UserProfileModule } from './modules/users/user.module';
import { LikeModule } from './modules/likes/like.module';
import { ViewModule } from './modules/views/view.module';
// import { ShareModule } from './modules/share/share.module';
// import { PostsModule } from './modules/posts/posts.module';
// import { ReelsModule } from './modules/reels/reels.module';
import { AuthModule } from './modules/auth/auth.module';
import { StreamModule } from './modules/stream/stream.module';
import { FollowModule } from './modules/follows/follow.module';
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
    // ShareModule,
    // PostsModule,
    // ReelsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
