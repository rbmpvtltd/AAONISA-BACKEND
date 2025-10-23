// src/notifications/notification.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { UploadService } from '../upload/upload.service';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { lookup } from 'mime-types';
import * as sharp from 'sharp';


async function getThumbnailBase64(filePath: string, width = 50, height = 50): Promise<string | null> {
    try {
        const buffer = await readFile(filePath);
        const resizedBuffer = await sharp(buffer)
            .resize(width, height, { fit: 'cover' })
            .jpeg({ quality: 70 })
            .toBuffer();

        const filename = filePath.split('/').pop() || '';
        const mimeType = lookup(filename) || 'image/jpeg';
        return `data:${mimeType};base64,${resizedBuffer.toString('base64')}`;
    } catch (err) {
        console.error('Failed to generate thumbnail:', err);
        return null;
    }
}

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,

        @InjectRepository(UserProfile)
        private readonly userProfileRepository: Repository<UserProfile>,

        private readonly uploadService: UploadService
    ) { }

    // Create notification
    async createNotification(
        recipient: User,
        sender: User | null,
        type: NotificationType,
        message?: string,
        referenceId?: string,
    ): Promise<Notification> {
        if (!recipient) throw new Error('User not found');
        const notification = this.notificationRepo.create({
            recipient,
            sender: sender ?? undefined,
            type,
            message,
            referenceId,
            isRead: false,
        });


        const saved = await this.notificationRepo.save(notification);

        return saved;
    }

    // List all notifications for a user
    async getUserNotifications(payload: any): Promise<any[]> {
        const userId = payload.userId || payload.id || payload.sub;

        const notifications = await this.notificationRepo.find({
            where: { recipient: { id: userId } },
            relations: ['sender'],
            order: { createdAt: 'DESC' },
        });

        const toSignedUrl = async (path: string | null): Promise<string | null> => {
            if (!path) return null;
            const key = path.split('/').pop();
            if (!key) return null;
            const bucket = 'profiles';
            const fullKey = `${bucket}/${key}`;
            try {
                return await this.uploadService.getFileUrl(fullKey, 3600); // 1 hour expiry
            } catch (err) {
                console.error('Failed to generate signed URL:', err);
                return null;
            }
        };

        const result = await Promise.all(
            notifications.map(async (n) => {
                let senderInfo: { id: string; name: string; profilePicture?: string } | undefined = undefined;

                if (n.sender) {
                    const profile = await this.userProfileRepository.findOneBy({ user_id: n.sender.id });
                    const profilePictureSignedUrl = await toSignedUrl(profile?.ProfilePicture || null);

                    senderInfo = {
                        id: n.sender.id,
                        name: profile?.name || n.sender.username || 'Unknown User',
                        profilePicture: profilePictureSignedUrl || '',
                    };
                }

                return {
                    id: n.id,
                    recipientId: n.recipient.id,
                    sender: senderInfo,
                    type: n.type,
                    message: n.message,
                    referenceId: n.referenceId,
                    isRead: n.isRead,
                    createdAt: n.createdAt,
                };
            })
        );

        return result;
    }


    // Mark notification as read
    async markAsRead(notificationId: string): Promise<Notification> {
        const notification = await this.notificationRepo.findOneOrFail({
            where: { id: notificationId },
        });
        notification.isRead = true;
        return this.notificationRepo.save(notification);
    }

    // Mark all notifications of a user as read
    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationRepo.update({ recipient: { id: userId } }, { isRead: true });
    }
}
