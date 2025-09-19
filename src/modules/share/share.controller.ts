import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards ,Req } from '@nestjs/common';
import { ShareService } from './share.service';
import { ShareDto } from './dto/share.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('share')
export class ShareController {
    constructor(private readonly shareService: ShareService) { }
    @UseGuards(JwtAuthGuard)
    @Post('getShareLink')
    @ApiBody({ type: ShareDto })
    create(@Req() req: any, @Body() dto: ShareDto) {
        const userId = req.user.userId
        return this.shareService.createshare(dto, userId);
    }

    //   @Get('post/:postId')
    //   getSharesByPost(@Param('postId') postId: number) {
    //     return this.shareService.getSharesByPost(postId);
    //   }

    // @Get('user/:userId')
    // getSharesByUser(@Param('userId') userId: number) {
    //   return this.shareService.getSharesByUser(userId);
    // }
}
