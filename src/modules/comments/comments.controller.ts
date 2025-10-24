// import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
// import { CommentService } from './comments.service';
// import { CreateCommentDto } from './dto/create-comment.dto';
// import { UpdateCommentDto } from './dto/update-comment.dto';

// @Controller('comment')
// export class CommentController {
//   constructor(private readonly commentService: CommentService) {}

//   // Comments Module
//   // Add comment on post
//   @Post('/post/:postId')
//  async AddCommentOnPost(@Param('postId') postId: number) {
//     return this.commentService.AddCommentOnPost(postId);
//   }

//   // Add comment on reel
//   @Post('/reel/:reelId')
// AddCommentOnReel(@Param('reelId') reelId:number){
//   return this.commentService.AddCommentOnReel(reelId)
// } 

// //  Get all comments for post
//   @Get('post/:postId')
//     getAllCommentForPost(@Param('postId')  postId:number) {
//     return this.commentService.getAllCommentForPost(postId);
//   }

// //  Get all comments for reel
//   @Get('reel/:reelId')
//     getAllCommentForReel(@Param('reelId')  reelId:number) {
//     return this.commentService.getAllCommentForReel(reelId);
//   }

// //  Delete comment
//   @Delete(':id')
//   deleteComments(@Param('id') id: number) {
//     return this.commentService.deleteComments(+id);
//   }
// }

import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Body,
    Req,
    UseGuards,
} from '@nestjs/common';
import { CommentService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('comments')
export class CommentController {
    constructor(private readonly commentService: CommentService) { }

    @UseGuards(JwtAuthGuard)
    @Post('addComment')
    async create(@Body() dto: CreateCommentDto, @Req() req: any) {
        const payload = req.user;
        const userId = payload?.sub || payload?.id || payload?.userId;
        return this.commentService.create(dto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('getComments/:postId')
    async getPostComments(@Param('postId') postId: string) {
        return this.commentService.findByPost(postId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('getReplyComments/:commentId')
    async getReplyComments(@Param('commentId') commentId: string) {
        return this.commentService.findByReplies(commentId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('deleteComment/:id')
    async deleteComment(@Param('id') id: string, @Req() req: any) {
        const payload = req.user;
        const userId = payload?.sub || payload?.id || payload?.userId;
        return this.commentService.delete(id, userId);
    }
}
