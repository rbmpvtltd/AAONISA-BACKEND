// src/follow/follow.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { User } from '../users/entities/user.entity';
import { AppGateway } from 'src/app.gateway';
@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly gateway: AppGateway
  ) { }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException("You can't follow yourself");
    }

    const userToFollow = await this.userRepository.findOne({
      where: { id: followingId },
    });

    const userWhoFollow = await this.userRepository.findOne({
      where: { id: followerId },
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
    this.gateway.emitToUser(followingId, 'followState',`${followerId}` );

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

  async getFollowState(userId) {
    this.gateway.broadcast('message','hello')
    const user = await this.userRepository.find(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const followers = await this.followRepository.find({
      where: { following: userId },
      select: ["follower"],
    });

    const followings = await this.followRepository.find({ where: { follower: userId }, select: ["following"] });
    return {
      followers: followers.map(f => f.follower),
      followings: followings.map(f => f.following)
    };
  }
}
