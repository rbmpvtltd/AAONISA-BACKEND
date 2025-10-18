import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Video, VideoType } from './entities/video.entity';
import { Audio } from './entities/audio.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { Request, Response } from 'express';
import { AppGateway } from 'src/app.gateway';
import { validate as uuidValidate } from 'uuid';

const { createCanvas } = require('canvas');

interface OverlayMetadata {
    id: string;
    text: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    fontSize: number;
    color: string;
}

interface ProcessVideoOptions {
    inputPath: string;
    outputPath: string;
    trimStart?: number; // in seconds
    trimEnd?: number; // in seconds
    filterColor?: string; // e.g. "#FF000080" or "transparent"
    overlays?: OverlayMetadata[];
}
@Injectable()
export class VideoService {
    constructor(
        @InjectRepository(Video)
        private readonly videoRepository: Repository<Video>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Audio)
        private readonly audioRepository: Repository<Audio>,

        private readonly gateway: AppGateway
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

    private async compressVideoOverwrite(filePath: string): Promise<string> {
        const compressedPath = path.join(
            path.dirname(filePath),       // same folder
            `compressed_${path.basename(filePath)}` // compressed_ + original name
        );
        return new Promise((resolve, reject) => {
            ffmpeg(filePath)
                .outputOptions('-y') // overwrite existing file
                .videoCodec('libx264')
                .size('720x1280')      // 9:16 ratio
                .videoBitrate('3000k') // 3 Mbps
                .fps(30)               // frame rate
                .audioCodec('aac')     // copy audio
                .output(compressedPath)      // overwrite same file
                .on('end', () => {
                    console.log('✅ Compression completed and overwritten:', compressedPath);
                    resolve(compressedPath);
                })
                .on('error', (err) => {
                    console.error('❌ Compression failed:', err);
                    reject(err);
                })
                .run();
        });
    }
    private async processVideo(options: {
        inputPath: string;
        outputPath: string;
        trimStart?: number;
        trimEnd?: number;
        filterColor?: string;
        overlays?: {
            id: string;
            text: string;
            x: number;
            y: number;
            scale: number;
            rotation: number;
            fontSize: number;
            color: string;
        }[];
    }): Promise<void> {
        const { inputPath, outputPath, trimStart = 0, trimEnd, filterColor, overlays = [] } = options;
        const safeInput = inputPath.replace(/\\/g, '/');
        const safeOutput = outputPath.replace(/\\/g, '/');
        const compressed = await this.compressVideoOverwrite(safeInput);
        return new Promise((resolve, reject) => {
            try {
                fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                overlays.push({ id: 'dummy', text: 'dummy', x: 0, y: 0, scale: 1, rotation: 0, fontSize: 72, color: 'transparent' });

                const overlayPaths: string[] = [];

                // const generateOverlay = (text: string, overlay: any, index: number) => {
                //     const { fontSize, color, rotation } = overlay;

                //     // 1. Temporary canvas to measure text accurately
                //     const tempCanvas = createCanvas(1, 1);
                //     const tempCtx = tempCanvas.getContext('2d');
                //     tempCtx.font = `${fontSize*2}px Arial`;

                //     const metrics = tempCtx.measureText(text);
                //     const textWidth = metrics.width;
                //     const textHeight = (metrics.actualBoundingBoxAscent || fontSize) +
                //         (metrics.actualBoundingBoxDescent || 0);

                //     const rotatedWidth = Math.abs(textWidth * Math.cos(rotation)) + Math.abs(textHeight * Math.sin(rotation));
                //     const rotatedHeight = Math.abs(textWidth * Math.sin(rotation)) + Math.abs(textHeight * Math.cos(rotation));

                //     // 3. Create final canvas
                //     const canvas = createCanvas(rotatedWidth, rotatedHeight);
                //     const ctx = canvas.getContext('2d');

                //     // 4. Translate to center and rotate
                //     ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
                //     ctx.rotate(rotation);

                //     // 5. Draw text centered
                //     ctx.fillStyle = color;
                //     ctx.font = `${fontSize*2}px Arial`;
                //     ctx.textAlign = 'center';
                //     ctx.textBaseline = 'middle';
                //     ctx.fillText(text, 0, 0);

                //     // 6. Save PNG
                //     const overlayPath = path.join(process.cwd(), `overlay_${index}.png`);
                //     fs.writeFileSync(overlayPath, canvas.toBuffer('image/png'));

                //     return overlayPath;
                // };
                const generateOverlay = (text: string, overlay: any, index: number): string => {
                    const { fontSize, color, rotation } = overlay;

                    // 1. Temporary canvas to measure text accurately
                    const tempCanvas = createCanvas(1, 1);
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.font = `${fontSize * 2}px Arial`;
                    const metrics = tempCtx.measureText(text);
                    const textWidth = metrics.width;
                    const textHeight = (metrics.actualBoundingBoxAscent || fontSize) +
                        (metrics.actualBoundingBoxDescent || 0);

                    // 2. Add extra padding for rotation
                    const padding = 20;
                    const rotatedWidth = Math.abs(textWidth * Math.cos(rotation)) + Math.abs(textHeight * Math.sin(rotation)) + padding;
                    const rotatedHeight = Math.abs(textWidth * Math.sin(rotation)) + Math.abs(textHeight * Math.cos(rotation)) + padding;

                    // 3. Create final canvas
                    const canvas = createCanvas(rotatedWidth, rotatedHeight);
                    const ctx = canvas.getContext('2d');

                    // ✅ Enable subpixel anti-aliasing for sharp text
                    ctx.antialias = 'subpixel';

                    // 4. Translate to center and rotate
                    ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
                    ctx.rotate(rotation);

                    // 5. Draw text centered
                    ctx.fillStyle = color;
                    ctx.font = `${fontSize * 2}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, 0, 0);

                    // 6. Save PNG
                    const overlayPath = path.join(process.cwd(), `overlay_${index}.png`);
                    fs.writeFileSync(overlayPath, canvas.toBuffer('image/png'));

                    return overlayPath;
                };
                overlays.forEach((ov, i) => {
                    const overlayPath = generateOverlay(ov.text, ov, i);
                    overlayPaths.push(overlayPath);
                });

                let command = ffmpeg(compressed);
                overlayPaths.forEach(p => command.input(p));

                const duration = trimEnd && trimEnd > trimStart ? trimEnd - trimStart : undefined;
                if (trimStart > 0) command = command.setStartTime(trimStart);
                if (duration) command = command.setDuration(duration);

                const filterComplex: any[] = [];
                let lastOutput = 'v0';

                // if (filterColor && filterColor.toLowerCase() !== 'transparent') {
                //     filterComplex.push({
                //         filter: 'colorchannelmixer',
                //         options: this.hexToMixer(filterColor),
                //         outputs: 'v0'
                //     });
                // } else {
                //     lastOutput = '0:v';
                // }

                if (
                    filterColor &&
                    filterColor.toLowerCase() !== 'transparent' &&
                    filterColor !== '#00000000'
                ) {
                    const colorHex = filterColor.replace('#', '');
                    const hexRGB = colorHex.substring(0, 6);
                    const alpha = colorHex.length === 8
                        ? (parseInt(colorHex.substring(6, 8), 16) / 255).toFixed(2)
                        : 0.3;

                    const ffmpegColor = `0x${hexRGB}@${alpha}`;

                    filterComplex.push({
                        filter: 'color',
                        options: {
                            color: ffmpegColor,
                            size: '720x1280',
                            duration: '5',
                        },
                        outputs: ['color_layer'],
                    });

                    // Overlay color layer on video
                    filterComplex.push({
                        filter: 'overlay',
                        options: { x: 0, y: 0, shortest: 1 },
                        inputs: ['0:v', 'color_layer'],
                        outputs: ['v0'],
                    });

                    lastOutput = 'v0';
                } else {
                    lastOutput = '0:v';
                }





                overlays.forEach((ov, i) => {
                    const inputIndex = i + 1;
                    filterComplex.push({
                        filter: 'overlay',
                        options: { x: `${ov.x}`, y: `main_h - ${(ov.y)}-100` },
                        // options: { x: `0`, y: `main_h - overlay_h` },
                        inputs: [lastOutput, `${inputIndex}:v`],
                        outputs: `tmp${i}`
                    });
                    lastOutput = `tmp${i}`;
                });

                const finalOutput = overlays.length > 0 ? `tmp${overlays.length - 1}` : lastOutput;

                command
                    .complexFilter(filterComplex, finalOutput)
                    .outputOptions('-preset veryfast')
                    .save(safeOutput)
                    .on('start', cmd => console.log('🎬 FFmpeg command:', cmd))
                    .on('end', () => {
                        console.log('✅ Video processed with overlays & trimming!');
                        // cleanup
                        overlayPaths.forEach(p => {
                            if (fs.existsSync(p)) fs.unlinkSync(p);
                        });
                        resolve();
                    })
                    .on('error', err => {
                        console.error('❌ FFmpeg error:', err.message);
                        reject(err);
                    });

            } catch (err) {
                reject(err);
            }
        });
    }

    // private async processVideo(options: {
    //     inputPath: string;
    //     outputPath: string;
    //     trimStart?: number;
    //     trimEnd?: number;
    //     filterColor?: string;
    //     overlays?: {
    //         id: string;
    //         text: string;
    //         x: number;
    //         y: number;
    //         scale: number;
    //         rotation: number;
    //         fontSize: number;
    //         color: string;
    //     }[];
    // }): Promise<void> {
    //     const { inputPath, outputPath, trimStart = 0, trimEnd, filterColor, overlays = [] } = options;
    //     return new Promise((resolve, reject) => {
    //         try {
    //             fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    //             // Convert Windows backslashes to forward slashes
    //             const safeInput = inputPath.replace(/\\/g, '/');
    //             const safeOutput = outputPath.replace(/\\/g, '/');

    //             let command = ffmpeg(safeInput);

    //             // --- Trim video
    //             if (trimStart > 0) command = command.setStartTime(trimStart);
    //             if (trimEnd && trimEnd > trimStart) command = command.setDuration(trimEnd - trimStart);

    //             // --- Build filters
    //             const filters: any[] = [];

    //             // Safe color filter
    //             if (filterColor && filterColor.toLowerCase() !== 'transparent') {
    //                 filters.push({
    //                     filter: 'colorchannelmixer',
    //                     options: this.hexToMixer(filterColor), // safe hexToMixer
    //                 });
    //             }

    //             // Safe overlays
    //             for (const overlay of overlays) {
    //                 const safeText = overlay.text.replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/#/g, '\\#');
    //                 filters.push({
    //                     filter: 'drawtext',
    //                     options: {
    //                         text: safeText,        // NO single quotes here
    //                         x: Math.max(0, overlay.x),
    //                         y: Math.max(0, overlay.y),
    //                         fontsize: overlay.fontSize,
    //                         fontcolor: overlay.color,
    //                         angle: Math.round(overlay.rotation * 100) / 100, // safe 2 decimals
    //                     },
    //                 });
    //             }


    //             if (filters.length > 0) command = command.videoFilters(filters);

    //             // --- Encode safely
    //             command
    //                 .outputOptions('-preset veryfast')
    //                 .save(safeOutput)
    //                 .on('start', cmd => console.log('🎬 FFmpeg command:', cmd))
    //                 .on('end', () => {
    //                     console.log('✅ Video processed:', safeOutput);
    //                     resolve();
    //                 })
    //                 .on('error', err => {
    //                     console.error('❌ Error processing video:', err.message);
    //                     reject(err);
    //                 });

    //         } catch (err) {
    //             reject(err);
    //         }
    //     });
    // }



    async create(createVideoDto: CreateVideoDto, filename: string, userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new BadRequestException('User not found. Invalid token.');
        }

        // ---------------- AUDIO HANDLING ----------------
        let audio: Audio | null = null;
        if (createVideoDto.music && uuidValidate(createVideoDto.music.id)) {
            try {
                audio = await this.audioRepository.findOneOrFail({
                    where: { uuid: createVideoDto.music.id },
                });
            } catch (err) {
                console.warn('AudioId invalid or not found. Attempting to extract from video...');
            }
        }

        if (!audio && createVideoDto.music) {
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

        const overlayHashtags = createVideoDto.overlays
            .filter(item => item.text.startsWith('#'))
            .map(item => item.text);
        const overlayMentions = createVideoDto.overlays
            .filter(item => item.text.startsWith('@'))
            .map(item => item.text);
        // ---------------- MENTIONS HANDLING ----------------
        let mentionedUsers: User[] = [];
        let mentionsArray: string[] = [];

        if (createVideoDto.mentions) {
            try {
                if (typeof createVideoDto.mentions === 'string') {
                    mentionsArray = JSON.parse(createVideoDto.mentions);
                } else if (Array.isArray(createVideoDto.mentions)) {
                    mentionsArray = createVideoDto.mentions;
                } else {
                    mentionsArray = [];
                }
            } catch (err) {
                throw new BadRequestException('Mentions must be a valid JSON array of usernames.');
            }
        }

        if (mentionsArray.length) {
            mentionedUsers = await this.userRepository.findBy({
                username: In(mentionsArray),
            });

            const foundUsernames = mentionedUsers.map((u) => u.username);
            const missing = mentionsArray.filter((u) => !foundUsernames.includes(u));

            if (missing.length) {
                console.warn(`Ignored invalid mentions: ${missing.join(', ')}`);
            }

        }
        let externalAudioSrc = '';
        if (createVideoDto.music && !uuidValidate(createVideoDto.music.id)) {
            externalAudioSrc = createVideoDto.music.uri || '';
        }

        const videoPath = path.join(process.cwd(), 'src', 'uploads', 'videos', filename);
        // --- PROCESS VIDEO BEFORE SAVING ---
        const processedFilename = `${filename}`;
        const processedPath = path.join(process.cwd(), 'src', 'uploads', 'processedVideos', processedFilename);

        await this.processVideo({
            inputPath: videoPath,
            outputPath: processedPath,
            trimStart: Number(createVideoDto.trimStart) || 0,
            trimEnd: Number(createVideoDto.trimEnd) || 0,
            filterColor: createVideoDto.filter || 'transparent',
            overlays: createVideoDto.overlays || [],
        });

        // Replace original with processed version
        // fs.unlinkSync(videoPath); // delete original if you want
        filename = processedFilename;

        // ---------------- CREATE VIDEO ----------------
        const video = this.videoRepository.create({
            title: createVideoDto.title,
            caption: createVideoDto.caption,
            type: createVideoDto.type || VideoType.reels,
            externalAudioSrc: externalAudioSrc,
            // hashtags: createVideoDto.hashtags,
            user_id: user,
            audio: audio || null,
            videoUrl: `/uploads/videos/${filename}`,
            mentions: mentionedUsers,
        });

        await this.videoRepository.save(video);

        for (const mentionedUser of mentionedUsers) {
            this.gateway.emitToUser(
                mentionedUser.id,
                'mentioned_in_video',
                {
                    whoMentioned: user.username,
                    videoId: video.uuid
                }
            );
        }

        return "stream uploaded succsessfully";
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

        const filePath = path.join(process.cwd(), 'src', video.videoUrl);
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
