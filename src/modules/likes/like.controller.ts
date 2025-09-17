// src/like/like.controller.ts

import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { LikeService } from './like.service';
import { LikeDto } from './dto/like.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Like')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post('toggle')
  async toggleLike(@Body() dto: LikeDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.likeService.toggleLike(userId, dto.reel_id);
  }
}
