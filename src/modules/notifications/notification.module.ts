// src/notifications/notification.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notifications.controller';
import { UserProfileModule } from '../users/user.module';
import { UserProfile } from '../users/entities/user-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification,UserProfile]),
    forwardRef(() => UserProfileModule),
  ],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
