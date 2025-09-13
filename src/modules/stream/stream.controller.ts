import { Multer } from 'multer';
import { Controller, Post, UploadedFile, UseInterceptors, Body,UseGuards,Req,BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateVideoDto } from './dto/create-video.dto';
import { VideoService } from './stream.service'
import { join } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import {Request} from 'express';
@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
  FileInterceptor('video', {
    storage: diskStorage({
      destination: join(process.cwd(),'src', 'uploads', 'videos'),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
  }),
)
  async uploadVideo(
    @UploadedFile() file: Multer.File,
    @Body() createVideoDto: CreateVideoDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId?: string }
    if (!user || !user.userId) {
      throw new BadRequestException('Invalid or missing user ID in token.');
    }
    return this.videoService.create(createVideoDto, file.filename, user.userId);
  }
}
