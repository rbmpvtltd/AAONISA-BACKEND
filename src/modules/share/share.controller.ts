import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ShareService } from './share.service';
import { CreateShareDto } from './dto/create-share.dto';
import { UpdateShareDto } from './dto/update-share.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post()
    @ApiOperation({ summary: 'Create a new user' })
    @ApiBody({ type: CreateShareDto  })
    @ApiResponse({ status: 201, description: 'User created successfully',  })
  create(@Body()   createShareDto: CreateShareDto) {
    return this.shareService.createshare(createShareDto);
  }

  @Get('post/:postId')
  getSharesByPost(@Param('postId') postId: number) {
    return this.shareService.getSharesByPost(postId);
  }

  // @Get('user/:userId')
  // getSharesByUser(@Param('userId') userId: number) {
  //   return this.shareService.getSharesByUser(userId);
  // }
}
