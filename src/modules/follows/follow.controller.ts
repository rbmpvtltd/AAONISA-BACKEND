// src/follow/follow.controller.ts

import {
  Controller,
  Post,
  Delete,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { FollowService } from './follow.service';
import { CreateFollowDto } from './dto/follow.dto';

@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @UseGuards(JwtAuthGuard)
  @Post('addfollow')
  async followUser(
    @Body() dto: CreateFollowDto,
    @Req() req: any,
  ) {
    const followerId = req.user.userId;
    return this.followService.followUser(followerId, dto.following);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('unfollow')
  async unfollowUser(
    @Body() dto: CreateFollowDto,
    @Req() req: any,
  ) {
    const followerId = req.user.userId;
    return this.followService.unfollowUser(followerId, dto.following);
  }
}
