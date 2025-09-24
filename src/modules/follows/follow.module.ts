// src/follow/follow.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { FollowService } from './follow.service';
import { User } from '../users/entities/user.entity';
import { FollowController } from './follow.controller';
import { AppGateway } from 'src/app.gateway';
import { UserProfile } from '../users/entities/user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Follow, User,UserProfile])],
  controllers: [FollowController],
  providers: [FollowService,AppGateway],
  exports: [FollowService],
})
export class FollowModule {}
