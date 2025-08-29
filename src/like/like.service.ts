import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLikeDto } from './dto/create-like.dto';
import { UpdateLikeDto } from './dto/update-like.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Like,  } from './entities/like.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
  ) {}

  async likePost(createLikeDto: CreateLikeDto): Promise<Like> {
    const { user_id, post_id } = createLikeDto;

    const existingLike = await this.likeRepository.findOne({
      where: { user_id, post_id },
    });

    if (existingLike) {
      throw new BadRequestException('Already liked this post');
    }

    const like = this.likeRepository.create(createLikeDto);
    return await this.likeRepository.save(like);
  }

  async unlikePost(user_id: number, post_id: number): Promise<void> {
    await this.likeRepository.delete({ user_id, post_id });
  }

  async countLikes(post_id: number): Promise<number> {
    return this.likeRepository.count({ where: { post_id } });
  }
}