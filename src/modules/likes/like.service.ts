// src/like/like.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';   
import { Video } from "../stream/entities/video.entity";
import { TokenService } from '../tokens/token.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/entities/notification.entity';
@Injectable()
export class LikeService {
    constructor(
        @InjectRepository(Like)
        private readonly likeRepository: Repository<Like>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Video)
        private readonly videoRepository: Repository<Video>,
        private readonly tokenService: TokenService,
        private readonly notificationService: NotificationService
    ) { }

    // async toggleLike(userId: string, reelId: string) {
    //     if(userId == null || userId == undefined || userId == '') throw new BadRequestException('userId is required');
    //     if(reelId == null || reelId == undefined || reelId == '') throw new BadRequestException('reelId is required');
    //     const existingLike = await this.likeRepository.findOne({
    //         where: { user: {id:userId}, reel: {uuid: reelId} },
    //     });

    //     if (existingLike) {
    //         await this.likeRepository.remove(existingLike);
    //         return { message: 'Reel unliked', liked: false };
    //     } else {
    //         const userInfo = await this.userRepository.findOne({ where: { id: userId } });
    //         if (!userInfo) {
    //             throw new NotFoundException('User not found');
    //         }
    //         const reelInfo = await this.videoRepository.findOne({ where: { uuid: reelId } });
    //         if (!reelInfo) {
    //             throw new NotFoundException('Reel not found');
    //         }   
    //         const newLike = this.likeRepository.create({ user: userInfo, reel: reelInfo });
    //         await this.likeRepository.save(newLike);
    //         return { message: 'Reel liked', liked: true };
    //     }
    // }
    async toggleLike(userId: string, reelId: string) {
    if (!userId) throw new BadRequestException('userId is required');
    if (!reelId) throw new BadRequestException('reelId is required');

    const existingLike = await this.likeRepository.findOne({
        where: { user: { id: userId }, reel: { uuid: reelId } },
        relations: ['reel', 'reel.user_id'], // 🔴 reel owner needed
    });

    // 🔁 UNLIKE
    if (existingLike) {
        await this.likeRepository.remove(existingLike);
        return { message: 'Reel unliked', liked: false };
    }

    // ❤️ LIKE
    const userInfo = await this.userRepository.findOne({ where: { id: userId } });
    if (!userInfo) throw new NotFoundException('User not found');

    const reelInfo = await this.videoRepository.findOne({
            where: { uuid: reelId },
            relations: {
                user_id: true,
            },
        });
    if (!reelInfo) throw new NotFoundException('Reel not found');

    const newLike = this.likeRepository.create({
        user: userInfo,
        reel: reelInfo,
    });

    await this.likeRepository.save(newLike);

    // ❌ self-like pe notification mat bhejo
    if (reelInfo.user_id.id !== userInfo.id) {
        // 🔔 Push notification
        try {
            this.tokenService.sendNotification(
                reelInfo.user_id.id,
                'Hithoy',
                `${userInfo.username} liked your reel`,
            );
        } catch (err) {
            console.warn('Push notification failed:', err.message);
        }
            this.notificationService.createNotification(
            reelInfo.user_id,           
            userInfo,                
            NotificationType.LIKE,     
            `${userInfo.username} liked your reel`,
            reelInfo.uuid,              
        );
    }

    return { message: 'Reel liked', liked: true };
}

}
