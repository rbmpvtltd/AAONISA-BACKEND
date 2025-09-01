import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";

Controller('notifications')
export class callsControllers {
    constructor(private readonly notificationsService: NotificationsService) { }

    //  Notifications Module
    // Start live stream
    @Get()
    getNotifications() {
        return this.notificationsService.GetNotifications()
    }

    //Mark single as read
    @Put(':id/mark-read')
    markSingleAsRead(@Param('id') id: string) {
        return this.notificationsService.markSingleAsRead(id);
    }

    //  Mark all as read
    @Put('mark-all-read')
    markAllAsRead(@Body() createNotificationDto: CreateNotificationDto) {
        return this.notificationsService.markAllAsRead(createNotificationDto)
    }

    // Delete notification
    @Delete(':id')
    deleteNotification(@Param('id') id: string) {
        return this.notificationsService.DeleteNotification(id)
    }


}

