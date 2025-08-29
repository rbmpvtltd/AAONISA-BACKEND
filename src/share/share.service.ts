import { Injectable } from '@nestjs/common';
import { CreateShareDto } from './dto/create-share.dto';
import { UpdateShareDto } from './dto/update-share.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Share } from './entities/share.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ShareService {
  constructor(@InjectRepository(Share)  private readonly shareRepository : Repository<Share>,) {}
  
 async createshare(createShareDto: CreateShareDto): Promise<Share> {
    console.log('Incoming DTO:', createShareDto);
  const share = this.shareRepository.create(createShareDto);
  return await this.shareRepository.save(share);
}

  async getSharesByPost(post_id: number) {
    return this.shareRepository.find({where :{post_id}});
  }

    // async getSharesByUser(userId: number): Promise<Share[]> {
    // return this.shareRepository.find({
    //   where: { user: { id: userId } },
    //   relations: ['user', 'post'],
    // });
}
