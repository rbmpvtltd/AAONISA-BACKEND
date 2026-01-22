// src/notifications/notification.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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

  // 1️⃣ Fetch notifications
  const notifications = await this.notificationRepo.find({
    where: { recipient: { id: userId } },
    relations: ['sender', 'recipient'],
    order: { createdAt: 'DESC' },
  });

  // 2️⃣ Collect unique senderIds
  const senderIds = Array.from(
    new Set(
      notifications
        .map(n => n.sender?.id)
        .filter((id): id is string => Boolean(id))
    )
  );

  // 3️⃣ Bulk fetch profiles
  const profiles = senderIds.length
    ? await this.userProfileRepository.find({
        where: { user_id: In(senderIds) },
      })
    : [];

  // 4️⃣ Create map for fast lookup
  const profileMap = new Map(
    profiles.map(p => [p.user_id, p])
  );

  // 5️⃣ Signed URL helper (clean path)
  const toSignedUrl = async (path: string | null): Promise<string | null> => {
  if (!path) return null;

  // 1️⃣ remove query params
  let cleanPath = path.split('?')[0];

  // 2️⃣ agar full URL hai to domain hatao
  if (cleanPath.startsWith('http')) {
    cleanPath = cleanPath.replace(
      'https://pub-38b6f70d9fb1487292de6386fc39e570.r2.dev/',
      ''
    );
  }

  // final safety
  if (!cleanPath.startsWith('profiles/')) {
    console.error('Invalid profile image key:', cleanPath);
    return null;
  }

  return this.uploadService.getFileUrl(cleanPath, 3600);
};


  // 6️⃣ Build response
  return Promise.all(
    notifications.map(async (n) => {
      const profile = n.sender ? profileMap.get(n.sender.id) : null;

      return {
        id: n.id,
        recipientId: n.recipient.id,
        sender: n.sender
          ? {
              id: n.sender.id,
              name: profile?.name || n.sender.username || 'Unknown User',
              profilePicture: await toSignedUrl(profile?.ProfilePicture || null) || '',
            }
          : undefined,
        type: n.type,
        message: n.message,
        referenceId: n.referenceId,
        isRead: n.isRead,
        createdAt: n.createdAt,
      };
    })
  );
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
