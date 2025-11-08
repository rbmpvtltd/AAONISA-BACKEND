// src/follow/follow.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryBuilder } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { User } from '../users/entities/user.entity';
import { AppGateway } from 'src/app.gateway';
import { userInfo } from 'os';
import { UserProfile } from '../users/entities/user-profile.entity';
import { UploadService } from '../upload/upload.service';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { lookup } from 'mime-types'
import * as sharp from 'sharp';
import { TokenService } from '../tokens/token.service';
@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProFileRepository: Repository<UserProfile>,
    private readonly gateway: AppGateway,
    private readonly uploadService: UploadService,
    private readonly tokenService: TokenService
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
    await this.tokenService.sendNotification(followerId, 'Followed', `you followed ${userToFollow.username}`);
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
    relations: ['likes', 'views', 'videos'],
  });
  if (!user) throw new Error("User not found");

  // Followers
  const followers = await this.followRepository
    .createQueryBuilder("follows")
    .leftJoin(UserProfile, "user_profile", `"user_profile"."user_id"::uuid = "follows"."followerId"`)
    .leftJoin(User, "user", `"user"."id" = "follows"."followerId"`)
    .select([
      `"follows"."followerId" AS id`,
      `"user"."username" AS username`,
      `"user_profile"."name" AS name`,
      `"user_profile"."ProfilePicture" AS userProfilePicture`
    ])
    .where(`"follows"."followingId"::uuid = :userId`, { userId })
    .getRawMany();

  // Followings
  const followings = await this.followRepository
    .createQueryBuilder("follows")
    .leftJoin(UserProfile, "user_profile", `"user_profile"."user_id"::uuid = "follows"."followingId"`)
    .leftJoin(User, "user", `"user"."id" = "follows"."followingId"`)
    .select([
      `"follows"."followingId" AS id`,
      `"user"."username" AS username`,
      `"user_profile"."name" AS name`,
      `"user_profile"."ProfilePicture" AS userProfilePicture`
    ])
    .where(`"follows"."followerId"::uuid = :userId`, { userId })
    .getRawMany();

  // Helper to generate signed URL
  const toSignedUrl = async (path: string | null): Promise<string | null> => {
    if (!path) return null;
    const key = path.split('/').pop();
    if (!key) return null;
    const bucket = 'profiles';
    const fullKey = `${bucket}/${key}`;
    try {
      return await this.uploadService.getFileUrl(fullKey, 3600); // valid 1 hour
    } catch (err) {
      console.error('Failed to generate signed URL:', err);
      return null;
    }
  };

  // Followers with signed URLs
  const followersWithUrls = await Promise.all(
    followers.map(async f => ({
      ...f,
      userProfilePicture: await toSignedUrl(f.userprofilepicture)
    }))
  );

  // Followings with signed URLs
  const followingsWithUrls = await Promise.all(
    followings.map(async f => ({
      ...f,
      userProfilePicture: await toSignedUrl(f.userprofilepicture)
    }))
  );

  // User's own profile picture
  const userProfileInfo = await this.userProFileRepository.findOneBy({ user_id: userId });
  const profilePictureSignedUrl = await toSignedUrl(userProfileInfo?.ProfilePicture || null);

  return {
    userInfo: user,
    userProfileInfo: {
      ...userProfileInfo,
      ProfilePicture: profilePictureSignedUrl
    },
    followers: followersWithUrls,
    followings: followingsWithUrls,
  };
}

  
}
