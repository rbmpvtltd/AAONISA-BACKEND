import { Multer } from 'multer';
import { Controller, Post, UploadedFile, UseInterceptors, Body, UseGuards, Req, BadRequestException, Res, Get, Param, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateVideoDto } from './dto/create-video.dto';
import { VideoService } from './stream.service'
import { join } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Request, Response } from 'express';
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
    @Body() body:any,
    @Req() req: Request,
  ) {
    const user = req.user as { userId?: string }
    if (!user || !user.userId) {
      throw new BadRequestException('Invalid or missing user ID in token.');
    }
    const createVideoDto: CreateVideoDto = {
      ...body,
      type: body.type,
      trimStart: body.trimStart,
      trimEnd: body.trimEnd,
      videoVolume: body.videoVolume,
      filterId: body.filterId || 'transparent',
      title: body.title || '',
      caption: body.caption || '',
      hashtags: body.hashtags ? (body.hashtags as string).split(' ').filter(Boolean) : undefined,
      mentions: body.mentions ? (body.mentions as string).split(' ').filter(Boolean) : undefined,
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
}
