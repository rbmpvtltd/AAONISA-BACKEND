import { Injectable, NotFoundException,BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './entities/video.entity';
import { Audio } from './entities/audio.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { Request,Response } from 'express';
@Injectable()
export class VideoService {
    constructor(
        @InjectRepository(Video)
        private readonly videoRepository: Repository<Video>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Audio)
        private readonly audioRepository: Repository<Audio>,
    ) { }
    private async checkIfVideoHasAudio(filePath: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) return reject(err);

                const hasAudio = metadata.streams.some((s) => s.codec_type === 'audio');
                resolve(hasAudio);
            });
        });
    }
    private async extractAudioFromVideo(videoPath: string, outputAudioPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .noVideo()
                .audioCodec('libmp3lame')
                .save(outputAudioPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });
    }

    async create(createVideoDto: CreateVideoDto, filename: string, userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new BadRequestException('User not found. Invalid token.');
        }

        let audio: Audio | null = null;
        if (createVideoDto.audioId) {
            try {
                audio = await this.audioRepository.findOneOrFail({
                    where: { uuid: createVideoDto.audioId },
                });
            } catch (err) {
                console.warn('AudioId invalid or not found. Attempting to extract from video...');
            }
        }

        if (!audio) {
            const videoPath = path.join(process.cwd(), 'src', 'uploads', 'videos', filename);
            const audioFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.mp3`;
            const audioPath = path.join(process.cwd(), 'src', 'uploads', 'audios', audioFilename);

            const audioFolder = path.dirname(audioPath);
            if (!fs.existsSync(audioFolder)) {
                fs.mkdirSync(audioFolder, { recursive: true });
            }

            const hasAudio = await this.checkIfVideoHasAudio(videoPath);
            if (hasAudio) {
                await this.extractAudioFromVideo(videoPath, audioPath);

                audio = this.audioRepository.create({
                    uuid: uuidv4(),
                    name: audioFilename,
                    category: 'auto-extracted',
                    author: userId,
                });

                await this.audioRepository.save(audio);
            }
        }
        const userInfo = await this.userRepository.findOne({ where: { id: userId } });
        if (!userInfo) {
            throw new NotFoundException('User not found');
        }
        const video = this.videoRepository.create({
            ...createVideoDto,
            user_id: userInfo,
            audio: audio || null,
            videoUrl: `/uploads/videos/${filename}`,
        });

        return await this.videoRepository.save(video);
    }


    async findAll(): Promise<String[]> {
        const videos = await this.videoRepository.find({
            select: ['uuid'],
            order: { created_at: 'DESC' },
        });
        return videos.map(v => v.uuid);
    }

    async streamVideo(id: string, req: Request, res: Response) {
    const video = await this.videoRepository.findOne({ where: { uuid: id } });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const filePath = path.join(process.cwd(),'src', video.videoUrl); 
    console.log(filePath)
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on server');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send(
          `Requested range not satisfiable\n${start} >= ${fileSize}`,
        );
        return;
      }

      const chunkSize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });

      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  }

    async findOne(id: string): Promise<Video> {
        const video = await this.videoRepository.findOne({
            where: { uuid: id },
            relations: ['audio'],
        });

        if (!video) {
            throw new NotFoundException('Video not found');
        }

        return video;
    }

    async archive(id: string): Promise<Video> {
        const video = await this.findOne(id);
        video.archived = true;
        return this.videoRepository.save(video);
    }
}
