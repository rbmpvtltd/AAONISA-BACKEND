import { Injectable, NotFoundException } from '@nestjs/common';
import { ShareDto } from './dto/share.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Share } from './entities/share.entity';
import { Repository } from 'typeorm';
import { Video } from '../stream/entities/video.entity';

@Injectable()
export class ShareService {
  constructor(
    @InjectRepository(Share)
    private readonly shareRepository: Repository<Share>,

    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  /**
   * Reel share karna (same reel, same users multiple times allowed)
   */
  async createShare(
    dto: ShareDto,
    sharedByUserId: string,
  ): Promise<void> {
    // Reel exist karta hai ya nahi
    const reel = await this.videoRepository.findOne({
      where: { uuid: dto.reel_id },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    // Har baar new entry create hogi
    const share = this.shareRepository.create({
      reel_id: dto.reel_id,
      shared_by_user_id: sharedByUserId,
      shared_to_user_id: dto.shared_to_user_id,
    });

    await this.shareRepository.save(share);

    // return {
    //   link: reel.videoUrl,
    // };
  }

  /**
   * Kisi reel ka total share count
   */
  async getReelShareCount(reel_id: string): Promise<{ reel_id: string; count: number }> {
    const count = await this.shareRepository.count({
      where: { reel_id },
    });

    return {
      reel_id,
      count,
    };
  }
}
