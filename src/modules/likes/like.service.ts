// src/like/like.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';   
import { Video } from "../stream/entities/video.entity";
@Injectable()
export class LikeService {
    constructor(
        @InjectRepository(Like)
        private readonly likeRepository: Repository<Like>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Video)
        private readonly videoRepository: Repository<Video>,

    ) { }

    async toggleLike(userId: string, reelId: string) {
        if(userId == null || userId == undefined || userId == '') throw new BadRequestException('userId is required');
        if(reelId == null || reelId == undefined || reelId == '') throw new BadRequestException('reelId is required');
        const existingLike = await this.likeRepository.findOne({
            where: { user: {id:userId}, reel: {uuid: reelId} },
        });

        if (existingLike) {
            await this.likeRepository.remove(existingLike);
            return { message: 'Reel unliked', liked: false };
        } else {
            const userInfo = await this.userRepository.findOne({ where: { id: userId } });
            if (!userInfo) {
                throw new NotFoundException('User not found');
            }
            const reelInfo = await this.videoRepository.findOne({ where: { uuid: reelId } });
            if (!reelInfo) {
                throw new NotFoundException('Reel not found');
            }   
            const newLike = this.likeRepository.create({ user: userInfo, reel: reelInfo });
            await this.likeRepository.save(newLike);
            return { message: 'Reel liked', liked: true };
        }
    }
}
