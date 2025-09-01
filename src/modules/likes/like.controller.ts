import { Controller, Post, Delete, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { LikesService } from './like.service';
import { CreateLikeDto } from './dto/create-like.dto';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  // Like post
@Post('post/:postId')
async likePost(
  @Param('postId', ParseIntPipe) postId: number,
  @Body() createLikeDto: CreateLikeDto,
) {
  return this.likesService.likePost(postId, createLikeDto);
}

//  Unlike post
 @Delete('post/:postId')
  async unlikePost(
    @Param('postId', ) postId: string,
    @Body('userId', ) userId: string,
  ) {
    return this.likesService.unlikePost(postId, userId);
  }

// Like reel
@Post('post/:reelId')
async likePost(
  @Param('reelId', ParseIntPipe) reelId: number,
  @Body() createLikeDto: CreateLikeDto,
) {
  return this.likesService.likePost(reelId, createLikeDto);
}

//  Unlike reel
 @Delete('post/:reelId')
  async unlikePost(
    @Param('reelId', ) postId: string,
    @Body('userId', ) userId: string,
  ) {
    return this.likesService.unlikePost(reelId, userId);
  }

//  Get users who liked post
  @Get('/post/:postId')
  async  GetUsersWhoLikedPost(@Param('postId') postId: string) {
    return { likes: await this.likesService.GetUsersWhoLikedPost(postId) };
  }

  //  Get users who liked reel
  @Get('/post/:reelId')
  async  GetUsersWhoLikedPost(@Param('reelId') postId: string) {
    return { likes: await this.likesService.GetUsersWhoLikedPost(reelId) };
  }
}