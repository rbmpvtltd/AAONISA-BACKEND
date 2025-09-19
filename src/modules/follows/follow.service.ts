// src/follow/follow.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException("You can't follow yourself");
    }

    const userToFollow = await this.userRepository.findOne({
      where: { id: followingId },
    });

    if (!userToFollow) {
      throw new NotFoundException('User to follow not found');
    }

    const alreadyFollowing = await this.followRepository.findOne({
      where: { follower: followerId, following: followingId },
    });

    if (alreadyFollowing) {
      throw new BadRequestException('You are already following this user');
    }

    const follow = this.followRepository.create({
      follower: followerId,
      following: followingId,
    });

    await this.followRepository.save(follow);

    return { message: 'Followed successfully', follow };
  }

  async unfollowUser(followerId: string, followingId: string) {
    const follow = await this.followRepository.findOne({
      where: { follower: followerId, following: followingId },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    await this.followRepository.remove(follow);

    return { message: 'Unfollowed successfully' };
  }
}
