import { Injectable } from '@nestjs/common';
import { ShareDto } from './dto/share.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Share } from './entities/share.entity';
import { Repository } from 'typeorm';
import {Video} from '../stream/entities/video.entity'
@Injectable()
export class ShareService {
    constructor(@InjectRepository(Share) private readonly shareRepository: Repository<Share>,@InjectRepository(Video) private readonly videoRepository: Repository<Video>) { }

    async createshare(dto: ShareDto, userId: string): Promise<{ link: string }> {
    let share = await this.shareRepository.findOne({
      where: { reel_id: dto.reel_id, user_id: userId },
    });
    if (!share) {
      share = this.shareRepository.create({
        reel_id: dto.reel_id,
        user_id: userId,
      });
      await this.shareRepository.save(share);
    }

    const reel = await this.videoRepository.findOne({
      where: { uuid: dto.reel_id },
    });

    if (!reel) {
      throw new Error('Reel not found');
    }

    const baseUrl = 'http://localhost:3000';
    const link = `${baseUrl}${reel.videoUrl}`;

    return { link };
  }

    //   async getSharesByPost(post_id: number) {
    //     return this.shareRepository.find({where :{post_id}});
    //   }

    // async getSharesByUser(userId: number): Promise<Share[]> {
    // return this.shareRepository.find({
    //   where: { user: { id: userId } },
    //   relations: ['user', 'post'],
    // });
}
