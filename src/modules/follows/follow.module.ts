// src/follow/follow.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { FollowService } from './follow.service';
import { User } from '../users/entities/user.entity';
import { FollowController } from './follow.controller';
import { SharedModule } from 'src/modules/shared/shared.module';
import { UserProfile } from '../users/entities/user-profile.entity';
import { UploadService } from '../upload/upload.service';
import { TokenModule } from '../tokens/token.module';
import { NotificationModule } from '../notifications/notification.module';
@Module({
  imports: [TypeOrmModule.forFeature([Follow, User,UserProfile]),TokenModule,SharedModule,NotificationModule],
  controllers: [FollowController],
  providers: [FollowService,UploadService],
  exports: [FollowService],
})
export class FollowModule {}
