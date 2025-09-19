// src/view/view.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { View } from './entities/view.entity';

@Injectable()
export class ViewService {
  constructor(
    @InjectRepository(View)
    private readonly viewRepository: Repository<View>,

  ) {}

  async viewReel(userId: string, reelId: string) {
    const alreadyViewed = await this.viewRepository.findOne({
      where: { user_id: userId, reel_id: reelId },
    });


    if (alreadyViewed) {
      return { message: 'Reel already viewed', viewed: false };
    }

    const view = this.viewRepository.create({ user_id: userId, reel_id: reelId });
    await this.viewRepository.save(view);

    return { message: 'Reel viewed successfully', viewed: true };
  }
}
