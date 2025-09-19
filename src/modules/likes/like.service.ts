// src/like/like.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LikeService {
    constructor(
        @InjectRepository(Like)
        private readonly likeRepository: Repository<Like>,


    ) { }

    async toggleLike(userId: string, reelId: string) {
        const existingLike = await this.likeRepository.findOne({
            where: { user_id: userId, reel_id: reelId },
        });

        if (existingLike) {
            await this.likeRepository.remove(existingLike);
            return { message: 'Reel unliked', liked: false };
        } else {
            const newLike = this.likeRepository.create({ user_id: userId, reel_id: reelId });
            await this.likeRepository.save(newLike);
            return { message: 'Reel liked', liked: true };
        }
    }
}
