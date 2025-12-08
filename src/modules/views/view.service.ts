// src/view/view.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { View } from './entities/view.entity';
import { User } from '../users/entities/user.entity';
import { Video } from '../stream/entities/video.entity';
@Injectable()
export class ViewService {
  constructor(
    @InjectRepository(View)
    private readonly viewRepository: Repository<View>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  async viewReel(userId: string, reelId: string) {
    const alreadyViewed = await this.viewRepository.findOne({
      where: { user: { id : userId }, reel: { uuid: reelId } },
    });


    if (alreadyViewed) {
      return { message: 'Reel already viewed', viewed: false };
    }
    
    const userInfo = await this.userRepository.findOne({ where: { id: userId } });
    if (!userInfo) {
      throw new NotFoundException('User not found');
    }
    const reelInfo = await this.videoRepository.findOne({ where: { uuid: reelId } });
    if (!reelInfo) {
      throw new NotFoundException('Reel not found');
    }
    const view = this.viewRepository.create({ user: userInfo, reel: reelInfo });
    await this.viewRepository.save(view);

    return { message: 'Reel viewed successfully', viewed: true };
  }
  async getAllViews(storyId:string){
    const views = await this.viewRepository.find({where:{reel:{uuid:storyId}}});
    return views;
  }
}
