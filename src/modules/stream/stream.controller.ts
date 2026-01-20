import { Multer } from 'multer';
import { Controller, Post, UploadedFile, UseInterceptors, Body, UseGuards, Req, BadRequestException, Res, Get, Param, Query, Delete, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateVideoDto } from './dto/create-video.dto';
import { VideoService } from './stream.service'
import { join } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Request, Response } from 'express';
import { Roles } from 'src/common/utils/decorators';
import { UserRole } from '../users/entities/user.entity';
@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) { }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: join(process.cwd(), 'src', 'uploads', 'videos'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Multer.File,
    @Body() body: any,
    @Req() req: Request,
  ) {
    console.log('video body', body)
    const user = req.user as { userId?: string }
    if (!user || !user.userId) {
      throw new BadRequestException('Invalid or missing user ID in token.');
    }
    const createVideoDto: CreateVideoDto = {
      ...body,
      type: body.contentType,
      trimStart: body.trimStart,
      trimEnd: body.trimEnd,
      videoVolume: body.videoVolume,
      filterId: body.filterId || 'transparent',
      title: body.title || '',
      caption: body.caption || '',
      hashtags: body.hashtags ? (body.hashtags as string).split(' ').filter(Boolean) : [],
      mentions: body.mentions ? (body.mentions as string).split(' ').filter(Boolean) : [],
      music: body.music ? JSON.parse(body.music) : undefined,
      overlays: body.overlays ? JSON.parse(body.overlays) : undefined,
    };

    return this.videoService.create(createVideoDto, file.filename, user.userId);
  }

  @Get('/stream/:id')
  @UseGuards(JwtAuthGuard)
  async streamVideo(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.videoService.streamVideo(id, req, res);
  }

  @Get('/getAllStreamIds')
  @UseGuards(JwtAuthGuard)
  async findAll(
  ) {
    return this.videoService.findAll();
  }

  @Get('getAllStories')
  @UseGuards(JwtAuthGuard)
  async getAllStories(@Req() req) {
    const user = req.user as { userId?: string }
    if (!user || !user.userId) {
      throw new BadRequestException('Invalid or missing user ID in token.');
    }
    return this.videoService.getAllStories(user.userId);
  }

  // @Get('feed')
  // @UseGuards(JwtAuthGuard)
  // async getFeed(
  //   @Req() req: Request,
  //   @Query('type') type: 'followings' | 'news' | 'explore',
  //   @Query('page') page: string,
  //   @Query('limit') limit: string,
  // ) {
  //   const user = req.user as { userId?: string };
  //   if (!user || !user.userId) {
  //     throw new BadRequestException('Invalid or missing user ID in token.');
  //   }

  //   const feedType = type || 'news';
  //   const pageNum = parseInt(page, 10) || 1;
  //   const limitNum = parseInt(limit, 10) || 10;

  //   return this.videoService.getVideosFeed(user.userId, feedType, pageNum, limitNum);
  // }

  @Get('getAdminVideosFeed')
  @UseGuards(JwtAuthGuard)
  async getAdminVideosFeed(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('random') random = false
  ) {
    return this.videoService.getAdminVideosFeed(Number(page), Number(limit), Boolean(random));
  }


  @Get('feed')
  @UseGuards(JwtAuthGuard)
  async getFeed(
    @Req() req: Request,
    @Query('type') type: 'followings' | 'news' | 'explore',
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('random') random: string, // 👈 NEW
  ) {
    const user = req.user as { userId?: string };
    console.log("uuuuuuuuuuuuuuuuuuu", user);

    if (!user?.userId) {
      throw new BadRequestException('Invalid or missing user ID in token.');
    }

    return this.videoService.getVideosFeed(
      user.userId,
      type || 'news',
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 10,
      random === 'true' // 👈 string → boolean
    );
  }

  @Get('explore/:id')
  @UseGuards(JwtAuthGuard)
  async getExploreVideos(
    @Param('id') videoId: string,
    @Query('limit') limit: string,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: string };
    if (!user || !user.userId) {
      throw new BadRequestException('Invalid or missing user ID in token.');
    }

    const limitNum = parseInt(limit, 10) || 10;
    return this.videoService.getExploreVideosWithMain(user.userId,videoId, limitNum);
  }

  @Delete('/delete/:id')
  remove(@Param('id') id: string) {
    return this.videoService.deleteVideoById(id);
  }

  @Get('/getAudios')
  getAudios() {
    return this.videoService.getAutoExtractedAudios();
  }
}
