import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { CommentService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // Comments Module
  // Add comment on post
  @Post('/post/:postId')
 async AddCommentOnPost(@Param('postId') postId: number) {
    return this.commentService.AddCommentOnPost(postId);
  }

  // Add comment on reel
  @Post('/reel/:reelId')
AddCommentOnReel(@Param('reelId') reelId:number){
  return this.commentService.AddCommentOnReel(reelId)
} 

//  Get all comments for post
  @Get('post/:postId')
    getAllCommentForPost(@Param('postId')  postId:number) {
    return this.commentService.getAllCommentForPost(postId);
  }

//  Get all comments for reel
  @Get('reel/:reelId')
    getAllCommentForReel(@Param('reelId')  reelId:number) {
    return this.commentService.getAllCommentForReel(reelId);
  }
  
//  Delete comment
  @Delete(':id')
  deleteComments(@Param('id') id: number) {
    return this.commentService.deleteComments(+id);
  }
}
