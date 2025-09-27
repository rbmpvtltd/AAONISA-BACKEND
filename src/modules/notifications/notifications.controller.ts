// src/notifications/notification.controller.ts
import { Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';


@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('getAll')
  async getUserNotifications(@Req() req) {
    console.log(req.user);
    const payload = req.user;
    return this.notificationService.getUserNotifications(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('read/:notificationId')
  async markAsRead(@Param('notificationId') notificationId: string) {
    return this.notificationService.markAsRead(notificationId);
  }
}
