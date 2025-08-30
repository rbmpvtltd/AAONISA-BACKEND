import { Module } from '@nestjs/common';
import { ReelsService } from './reels.service';
import { ReelsController } from './reels.controller';

@Module({
  controllers: [ReelsController],
  providers: [ReelsService],
})
export class ReelsModule {}
