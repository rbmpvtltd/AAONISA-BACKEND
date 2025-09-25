// src/follow/follow.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { User } from '../users/entities/user.entity';
import { AppGateway } from 'src/app.gateway';
import { userInfo } from 'os';
import { UserProfile } from '../users/entities/user-profile.entity';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { lookup} from 'mime-types'
@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProFileRepository: Repository<UserProfile>,
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
    if (!userWhoFollow) {
      throw new NotFoundException('User who follow not found');
    }

    const alreadyFollowing = await this.followRepository.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId }
      },
    });

    if (alreadyFollowing) {
      throw new BadRequestException('You are already following this user');
    }

    const follow = this.followRepository.create({
      follower: userWhoFollow,
      following: userToFollow,
    });

    await this.followRepository.save(follow);
    this.gateway.emitToUser(followingId, 'followState', `${follow.follower}`);

    return { message: 'Followed successfully', follow };
  }

  async unfollowUser(followerId: string, followingId: string) {
    const follow = await this.followRepository.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId }
      },
    });

    if (!follow) throw new NotFoundException('Follow relationship not found');

    await this.followRepository.remove(follow);

    return { message: 'Unfollowed successfully' };
  }

  // async getFollowState(userId: string) {
  //   const user = await this.userRepository.findOne({
  //     where: { id: userId },
  //     relations: ['likes', 'views'],
  //   });

  //   if (!user) {
  //     throw new Error("User not found");
  //   }

  //   const followers = await this.followRepository.find({
  //     where: { following: { id: userId } },
  //     relations: ["follower"],
  //   });

  //   const followings = await this.followRepository.find({
  //     where: { follower: { id: userId } },
  //     relations: ["following"],

  //   });

  //   return {
  //     userInfo: user,
  //     userProfileInfo: await this.userProFileRepository.findOneBy({ user_id: userId }),
  //     followers: followers.map(f => f.follower.username),
  //     followings: followings.map(f => f.following.username),
  //   };
  // }
  async getFollowState(userId: string) {
  const user = await this.userRepository.findOne({
    where: { id: userId },
    relations: ['likes', 'views','videos'],
  });

  if (!user) {
    throw new Error("User not found");
  }

  // followers & followings
  const followers = await this.followRepository.find({
    where: { following: { id: userId } },
    relations: ["follower"],
  });

  const followings = await this.followRepository.find({
    where: { follower: { id: userId } },
    relations: ["following"],
  });

  // userProfileInfo
  const userProfileInfo = await this.userProFileRepository.findOneBy({ user_id: userId });
  let profilePictureBase64: string | null = null;
  let mimeType = 'image/jpeg'
  if (userProfileInfo && userProfileInfo.ProfilePicture) {
    const filename = userProfileInfo.ProfilePicture.split('/').pop() || '';
    try {
      const filePath = join(process.cwd(),'src','uploads','profiles',filename);
      const fileBuffer = await readFile(filePath);
      mimeType = lookup(filename) || 'image/jpeg';
      profilePictureBase64 = fileBuffer.toString('base64');
    } catch (err) {
      console.error("Failed to read profile picture:", err);
      profilePictureBase64 = null;
    }
  }

  return {
    userInfo: user,
    userProfileInfo: {
      ...userProfileInfo,
      ProfilePicture: `data:${mimeType};base64,${profilePictureBase64}`
    },
    followers: followers.map(f => f.follower.username),
    followings: followings.map(f => f.following.username),
  };
}
}
