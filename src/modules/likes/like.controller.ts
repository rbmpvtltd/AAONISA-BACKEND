import { Controller, Post, Delete, Get, Body, Param } from '@nestjs/common';
import { LikesService } from './like.service';
import { CreateLikeDto } from './dto/create-like.dto';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  async likePost(@Body() createLikeDto: CreateLikeDto) {
    return this.likesService.likePost(createLikeDto);
  }

  @Delete()
  async unlikePost(@Body() body: { user_id: number; post_id: number }) {
    return this.likesService.unlikePost(body.user_id, body.post_id);
  }

  @Get(':postId')
  async getLikesCount(@Param('postId') postId: number) {
    return { likes: await this.likesService.countLikes(postId) };
  }
}