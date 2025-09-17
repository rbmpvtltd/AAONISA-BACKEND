// import { Module } from '@nestjs/common';
// import { LikesService } from './like.service';
// import { LikesController } from './like.controller';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Like } from './entities/like.entity';

// @Module({
//   imports: [TypeOrmModule.forFeature([Like])],
//   controllers: [LikesController],
//   providers: [LikesService],
// })
// export class LikeModule {}
// src/like/like.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
@Module({
  imports: [TypeOrmModule.forFeature([Like])],
  controllers:[LikeController],
  providers: [LikeService],
  exports: [LikeService],
})
export class LikeModule {}
