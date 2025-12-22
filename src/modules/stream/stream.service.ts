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
import { Hashtag } from './entities/hashtag.entity';
import { Request, Response } from 'express';
import { AppGateway } from 'src/app.gateway';
import { validate as uuidValidate } from 'uuid';
import { UploadService } from '../upload/upload.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Follow } from '../follows/entities/follow.entity';
import { TokenService } from '../tokens/token.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/entities/notification.entity';
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
        @InjectRepository(Hashtag)
        private readonly hashtagRepo: Repository<Hashtag>,
        private readonly gateway: AppGateway,
        private readonly uploadService: UploadService,
        @InjectQueue('story-delete')
        private readonly storyDeleteQueue: Queue,
        @InjectQueue('hashtag-cleanup')
        private readonly hashtagCleanupQueue: Queue,
        @InjectRepository(Follow)
        private readonly followRepository: Repository<Follow>,

        private readonly tokenService: TokenService,
        private readonly notificationService: NotificationService
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
                .outputOptions('-y')
                .outputOptions('-movflags +faststart')     // ✅ instant playback
                .outputOptions('-preset veryfast')         // ✅ quick compression
                .outputOptions('-tune fastdecode')         // ✅ optimized for playback
                .outputOptions('-crf 23')                  // ✅ balanced quality-size ratio
                .videoCodec('libx264')
                .size('720x1280')
                .videoBitrate('2500k')
                .fps(30)
                .audioCodec('aac')
                .output(compressedPath)
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


    private async getVideoDuration(videoPath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            const ffmpeg = require('fluent-ffmpeg');

            ffmpeg.ffprobe(videoPath, (err: any, metadata: any) => {
                if (err) {
                    reject(err);
                } else {
                    const duration = Math.round(metadata.format.duration);
                    resolve(duration);
                }
            });
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

                let command = ffmpeg(safeInput);
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
                    .outputOptions('-movflags +faststart')     // ✅ instant playback
                    .outputOptions('-preset veryfast')         // ✅ quick compression
                    .outputOptions('-tune fastdecode')         // ✅ optimized for playback
                    .outputOptions('-crf 23')                  // ✅ balanced quality-size ratio
                    .audioCodec('aac')           // Audio preserve karo
                    .audioBitrate('128k')        // Audio quality
                    .outputOptions('-map', '0:a?')

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

    private async generateThumbnail(videoPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const thumbnailDir = path.join(process.cwd(), 'src', 'uploads', 'thumbnails');
            if (!fs.existsSync(thumbnailDir)) {
                fs.mkdirSync(thumbnailDir, { recursive: true });
            }

            const thumbnailFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
            const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

            ffmpeg(videoPath)
                .on('end', () => resolve(thumbnailPath))
                .on('error', (err) => reject(err))
                .screenshots({
                    timestamps: ['00:00:01'], // 1 second mark (or '0' for first frame)
                    filename: thumbnailFilename,
                    folder: thumbnailDir,
                    size: '640x?'
                });
        });
    }


    // async create(createVideoDto: CreateVideoDto, filename: string, userId: string) {
    //     console.log('createVideoDto:', createVideoDto);
    //     const user = await this.userRepository.findOne({ where: { id: userId } });

    //     if (!user) {
    //         throw new BadRequestException('User not found. Invalid token.');
    //     }

    //     // ---------------- AUDIO HANDLING ----------------
    //     let audio: Audio | null = null;
    //     if (createVideoDto.music && uuidValidate(createVideoDto.music.id)) {
    //         try {
    //             audio = await this.audioRepository.findOneOrFail({
    //                 where: { uuid: createVideoDto.music.id },
    //             });
    //         } catch (err) {
    //             console.warn('AudioId invalid or not found. Attempting to extract from video...');
    //         }
    //     }

    //     if (!audio && createVideoDto.music) {
    //         const videoPath = path.join(process.cwd(), 'src', 'uploads', 'videos', filename);
    //         const audioFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.mp3`;
    //         const audioPath = path.join(process.cwd(), 'src', 'uploads', 'audios', audioFilename);

    //         const audioFolder = path.dirname(audioPath);
    //         if (!fs.existsSync(audioFolder)) {
    //             fs.mkdirSync(audioFolder, { recursive: true });
    //         }

    //         const hasAudio = await this.checkIfVideoHasAudio(videoPath);
    //         if (hasAudio) {
    //             await this.extractAudioFromVideo(videoPath, audioPath);

    //             const uploadedAudio = await this.uploadService.uploadFile(audioPath, 'audios');
    //             audio = this.audioRepository.create({
    //                 uuid: uuidv4(),
    //                 name: uploadedAudio.publicUrl,
    //                 category: 'auto-extracted',
    //                 author: userId,
    //             });

    //             await this.audioRepository.save(audio);
    //             fs.unlinkSync(audioPath);
    //         }
    //     }

    //     const overlayHashtags = createVideoDto.overlays
    //         .filter(item => item.text.startsWith('#'))
    //         .map(item => item.text);
    //     const overlayMentions = createVideoDto.overlays
    //         .filter(item => item.text.startsWith('@'))
    //         .map(item => item.text);

    //     const normalizedTags = ([...overlayHashtags, ...createVideoDto.hashtags || []])
    //         .map((tag: string) => tag.trim().toLowerCase().replace(/^#/, ''));

    //     const existingTags = await this.hashtagRepo.find({
    //         where: normalizedTags.map((tag) => ({ tag })),
    //     });
    //     const existingTagNames = existingTags.map((t) => t.tag);
    //     const newTags = normalizedTags
    //         .filter((tag) => !existingTagNames.includes(tag))
    //         .map((tag) => this.hashtagRepo.create({ tag }));

    //     const overallTags = [...new Set([...existingTags, ...newTags])];
    //     // ---------------- MENTIONS HANDLING ----------------
    //     let mentionedUsers: User[] = [];
    //     let mentionsArray: string[] = [];
    //     let tempMentionsArray: string[] = [];
    //     if (createVideoDto.mentions || overlayMentions) {
    //         try {
    //             if (typeof createVideoDto.mentions === 'string') {
    //                 tempMentionsArray = JSON.parse(createVideoDto.mentions);
    //             } else if (Array.isArray(createVideoDto.mentions)) {
    //                 tempMentionsArray = createVideoDto.mentions;
    //             }
    //             if (Array.isArray(tempMentionsArray)) {
    //                 mentionsArray = tempMentionsArray;
    //             }
    //             if (overlayMentions && Array.isArray(overlayMentions)) {
    //                 mentionsArray = [...mentionsArray, ...overlayMentions];
    //             }
    //         } catch (err) {
    //             throw new BadRequestException('Mentions must be a valid JSON array of usernames.');
    //         }
    //     }

    //     if (mentionsArray.length) {
    //         mentionedUsers = await this.userRepository.findBy({
    //             username: In(mentionsArray),
    //         });

    //         const foundUsernames = mentionedUsers.map((u) => u.username);
    //         const missing = mentionsArray.filter((u) => !foundUsernames.includes(u));

    //         if (missing.length) {
    //             console.warn(`Ignored invalid mentions: ${missing.join(', ')}`);
    //         }

    //     }

    //     let externalAudioSrc = '';
    //     if (createVideoDto.music && !uuidValidate(createVideoDto.music.id)) {
    //         externalAudioSrc = createVideoDto.music.uri || '';
    //     }

    //     const videoPath = path.join(process.cwd(), 'src', 'uploads', 'videos', filename);
    //     const compressed = await this.compressVideoOverwrite(videoPath);
    //     const compressedPath = path.join(
    //         path.dirname(videoPath),
    //         `compressed_${path.basename(videoPath)}`
    //     );
    //     let uploadPath
    //     // --- PROCESS VIDEO BEFORE SAVING ---
    //     const processedFilename = `${filename}`;
    //     const processedPath = path.join(process.cwd(), 'src', 'uploads', 'processedVideos', processedFilename);
    //     if (createVideoDto.type === VideoType.story) {
    //         await this.processVideo({
    //             inputPath: compressedPath,
    //             outputPath: processedPath,
    //             trimStart: Number(createVideoDto.trimStart) || 0,
    //             trimEnd: Number(createVideoDto.trimEnd) || 0,
    //             filterColor: createVideoDto.filter || 'transparent',
    //             overlays: createVideoDto.overlays || [],
    //         });
    //         uploadPath = await this.uploadService.uploadFile(processedPath, 'stories');
    //         fs.unlinkSync(processedPath);
    //     } else {
    //         uploadPath = await this.uploadService.uploadFile(compressedPath, createVideoDto.type == VideoType.reels ? 'reels' : 'news');
    //     }
    //     let thumbnailPublicUrl = '';
    //     try {
    //         const thumbnailPath = await this.generateThumbnail(compressedPath);
    //         const uploadedThumb = await this.uploadService.uploadFile(thumbnailPath, 'thumbnails');
    //         thumbnailPublicUrl = uploadedThumb.publicUrl;
    //         fs.unlinkSync(thumbnailPath);
    //     } catch (err) {
    //         console.warn('Thumbnail generation failed:', err.message);
    //     }
    //     fs.unlinkSync(videoPath);
    //     fs.unlinkSync(compressedPath);
    //     filename = processedFilename;


    //     // ---------------- CREATE VIDEO ----------------
    //     const video = this.videoRepository.create({
    //         title: createVideoDto.title,
    //         caption: createVideoDto.caption,
    //         type: createVideoDto.type || VideoType.reels,
    //         externalAudioSrc: externalAudioSrc,
    //         hashtags: overallTags,
    //         user_id: user,
    //         audio: audio || null,
    //         videoUrl: uploadPath.publicUrl,
    //         mentions: mentionedUsers,
    //         thumbnailUrl: thumbnailPublicUrl,
    //     });

    //     await this.videoRepository.save(video);

    //     if (createVideoDto.type === VideoType.story) {
    //         await this.storyDeleteQueue.add(
    //             { videoId: video.uuid },
    //             { delay: 24 * 60 * 60 * 1000 },
    //         );

    //         console.log(`Scheduled story deletion after 24h (ID: ${video.uuid})`);
    //     }

    //     const hashtagsToClean = (video.hashtags || []).map(h => h.id || h.tag);
    //     // Note: map to whatever unique identifier your Hashtag entity uses (id/uuid/tag)

    //     if (hashtagsToClean.length) {
    //         // 7 days in ms
    //         const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    //         await this.hashtagCleanupQueue.add(
    //             'removeVideoFromHashtags', // job name (optional)
    //             {
    //                 videoId: video.uuid,
    //                 hashtagIdentifiers: hashtagsToClean,
    //             },
    //             {
    //                 delay: sevenDaysMs,
    //                 attempts: 3,
    //                 backoff: { type: 'exponential', delay: 60 * 1000 }, // retry strategy
    //                 removeOnComplete: true,
    //                 removeOnFail: false,
    //             },
    //         );
    //     }
    //     for (const mentionedUser of mentionedUsers) {
    //         this.gateway.emitToUser(
    //             mentionedUser.id,
    //             'mentioned_in_video',
    //             {
    //                 whoMentioned: user.username,
    //                 videoId: video.uuid
    //             }
    //         );
    //     }

    //     return "stream uploaded succsessfully";
    // }

    async create(createVideoDto: CreateVideoDto, filename: string, userId: string) {
        console.log('createVideoDto:', createVideoDto);
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new BadRequestException('User not found. Invalid token.');
        }

        // ✅ VIDEO DURATION - Sabse pehle calculate karo
        const videoPath = path.join(process.cwd(), 'src', 'uploads', 'videos', filename);
        let videoDuration = createVideoDto.duration || 15;

        // Agar frontend se duration nahi aaya to ffprobe se nikalo
        if (!createVideoDto.duration) {
            try {
                videoDuration = await this.getVideoDuration(videoPath);
                console.log(`Calculated video duration: ${videoDuration}s`);
            } catch (err) {
                console.warn('Could not get video duration, using default 15s:', err.message);
                videoDuration = 15;
            }
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
            const audioFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.mp3`;
            const audioPath = path.join(process.cwd(), 'src', 'uploads', 'audios', audioFilename);

            const audioFolder = path.dirname(audioPath);
            if (!fs.existsSync(audioFolder)) {
                fs.mkdirSync(audioFolder, { recursive: true });
            }

            const hasAudio = await this.checkIfVideoHasAudio(videoPath);
            if (hasAudio) {
                await this.extractAudioFromVideo(videoPath, audioPath);

                const uploadedAudio = await this.uploadService.uploadFile(audioPath, 'audios');
                audio = this.audioRepository.create({
                    uuid: uuidv4(),
                    name: uploadedAudio.publicUrl,
                    category: 'auto-extracted',
                    author: userId,
                });

                await this.audioRepository.save(audio);
                fs.unlinkSync(audioPath);
            }
        }

        const overlayHashtags = createVideoDto.overlays
            .filter(item => item.text.startsWith('#'))
            .map(item => item.text);
        const overlayMentions = createVideoDto.overlays
            .filter(item => item.text.startsWith('@'))
            .map(item => item.text);

        const normalizedTags = ([...overlayHashtags, ...createVideoDto.hashtags || []])
            .map((tag: string) => tag.trim().toLowerCase().replace(/^#/, ''));

        const existingTags = await this.hashtagRepo.find({
            where: normalizedTags.map((tag) => ({ tag })),
        });
        const existingTagNames = existingTags.map((t) => t.tag);
        const newTags = normalizedTags
            .filter((tag) => !existingTagNames.includes(tag))
            .map((tag) => this.hashtagRepo.create({ tag }));

        const overallTags = [...new Set([...existingTags, ...newTags])];

        // ---------------- MENTIONS HANDLING ----------------
        let mentionedUsers: User[] = [];
        let mentionsArray: string[] = [];
        let tempMentionsArray: string[] = [];
        if (createVideoDto.mentions || overlayMentions) {
            try {
                if (typeof createVideoDto.mentions === 'string') {
                    tempMentionsArray = JSON.parse(createVideoDto.mentions);
                } else if (Array.isArray(createVideoDto.mentions)) {
                    tempMentionsArray = createVideoDto.mentions;
                }
                if (Array.isArray(tempMentionsArray)) {
                    mentionsArray = tempMentionsArray;
                }
                if (overlayMentions && Array.isArray(overlayMentions)) {
                    mentionsArray = [...mentionsArray, ...overlayMentions];
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

        // const compressed = await this.compressVideoOverwrite(videoPath);
        // const compressedPath = path.join(
        //     path.dirname(videoPath),
        //     `compressed_${path.basename(videoPath)}`
        // );

        // let uploadPath;
        // // --- PROCESS VIDEO BEFORE SAVING ---
        // const processedFilename = `${filename}`;
        // const processedPath = path.join(process.cwd(), 'src', 'uploads', 'processedVideos', processedFilename);

        // if (createVideoDto.type === VideoType.story) {
        //     await this.processVideo({
        //         inputPath: compressedPath,
        //         outputPath: processedPath,
        //         trimStart: Number(createVideoDto.trimStart) || 0,
        //         trimEnd: Number(createVideoDto.trimEnd) || 0,
        //         filterColor: createVideoDto.filter || 'transparent',
        //         overlays: createVideoDto.overlays || [],
        //     });
        //     uploadPath = await this.uploadService.uploadFile(processedPath, 'stories');
        //     fs.unlinkSync(processedPath);
        // } else {
        //     uploadPath = await this.uploadService.uploadFile(compressedPath, createVideoDto.type == VideoType.reels ? 'reels' : 'news');
        // }
        const compressed = await this.compressVideoOverwrite(videoPath);
        const compressedPath = path.join(
            path.dirname(videoPath),
            `compressed_${path.basename(videoPath)}`
        );

        let uploadPath;
        // --- PROCESS VIDEO BEFORE SAVING ---
        const processedFilename = `${filename}`;
        const processedPath = path.join(process.cwd(), 'src', 'uploads', 'processedVideos', processedFilename);

        // ✅ Process video for ALL types (reels, stories, news)
        await this.processVideo({
            inputPath: compressedPath,
            outputPath: processedPath,
            trimStart: Number(createVideoDto.trimStart) || 0,
            trimEnd: Number(createVideoDto.trimEnd) || 0,
            filterColor: createVideoDto.filter || 'transparent',
            overlays: createVideoDto.overlays || [],
        });

        // Determine upload folder based on type
        let uploadFolder: string;
        if (createVideoDto.type === VideoType.story) {
            uploadFolder = 'stories';
        } else if (createVideoDto.type === VideoType.reels) {
            uploadFolder = 'reels';
        } else {
            uploadFolder = 'news';
        }

        uploadPath = await this.uploadService.uploadFile(processedPath, uploadFolder);
        fs.unlinkSync(processedPath);

        let thumbnailPublicUrl = '';
        try {
            const thumbnailPath = await this.generateThumbnail(compressedPath);
            const uploadedThumb = await this.uploadService.uploadFile(thumbnailPath, 'thumbnails');
            thumbnailPublicUrl = uploadedThumb.publicUrl;
            fs.unlinkSync(thumbnailPath);
        } catch (err) {
            console.warn('Thumbnail generation failed:', err.message);
        }

        fs.unlinkSync(videoPath);
        fs.unlinkSync(compressedPath);
        filename = processedFilename;

        // ---------------- CREATE VIDEO ----------------
        const video = this.videoRepository.create({
            title: createVideoDto.title,
            caption: createVideoDto.caption,
            type: createVideoDto.type || VideoType.reels,
            externalAudioSrc: externalAudioSrc,
            hashtags: overallTags,
            user_id: user,
            audio: audio || null,
            videoUrl: uploadPath.publicUrl,
            mentions: mentionedUsers,
            thumbnailUrl: thumbnailPublicUrl,
            duration: videoDuration, // ✅ Duration save
        });

        await this.videoRepository.save(video);

        if (createVideoDto.type === VideoType.story) {
            await this.storyDeleteQueue.add(
                { videoId: video.uuid },
                { delay: 24 * 60 * 60 * 1000 },
            );

            console.log(`Scheduled story deletion after 24h (ID: ${video.uuid})`);
        }

        const hashtagsToClean = (video.hashtags || []).map(h => h.id || h.tag);

        if (hashtagsToClean.length) {
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            await this.hashtagCleanupQueue.add(
                'removeVideoFromHashtags',
                {
                    videoId: video.uuid,
                    hashtagIdentifiers: hashtagsToClean,
                },
                {
                    delay: sevenDaysMs,
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 60 * 1000 },
                    removeOnComplete: true,
                    removeOnFail: false,
                },
            );
        }

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

        for (const mention of mentionedUsers) {
            try {
                this.tokenService.sendNotification(
                    mention.id,
                    'Hithoy',
                    `${user.username} mentioned you in a post`,
                );
                this.notificationService.createNotification(
                    mention,
                    user,
                    NotificationType.MENTION,
                    `${user.username} mentioned you in a post`,
                    video.uuid,
                );
            } catch (err) {
                console.warn('Notification failed:', err.message);
            }
        }



        return "stream uploaded successfully";
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

    async getAllStories(userId: string) {
        // Logged-in user
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["userProfile", "videos"]
        });

        if (!user) throw new NotFoundException("User not found");

        // Calculate 24-hour cutoff time
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - 24);

        // User ki khud ki stories (24h ke andar)
        const selfStories = user.videos
            .filter(v => v.type === "story" && new Date(v.created_at) >= cutoffTime)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Find whom user is following
        const following = await this.followRepository.find({
            where: { follower: { id: userId } },
            relations: ["following", "following.userProfile", "following.videos"]
        });

        // Prepare all story users (self + following)
        const storyUsers = [
            {
                username: user.username,
                profilePic: user.userProfile?.ProfilePicture || "",
                owner: user.id,
                self: true,
                stories: selfStories.map(story => ({
                    id: story.uuid,
                    videoUrl: story.videoUrl,
                    duration: story.duration || 15,
                    viewed: false,
                    created_at: story.created_at
                }))
            },
            ...following.map(f => {
                const u = f.following;
                const userStories = u.videos
                    .filter(v => v.type === "story" && new Date(v.created_at) >= cutoffTime)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                console.log("Story durations: ", selfStories.map(s => s.duration));


                return {
                    username: u.username,
                    profilePic: u.userProfile?.ProfilePicture || "",
                    owner: u.id,
                    self: false,
                    stories: userStories.map(story => ({
                        id: story.uuid,
                        videoUrl: story.videoUrl,
                        duration: story.duration || 15,
                        viewed: false,
                        created_at: story.created_at
                    }))
                };
            })
        ];
        console.log("ssssssssssssss", storyUsers);
        // Filter out users with no valid stories
        const validUsers = storyUsers.filter(user => user.stories.length > 0);

        // Sort users by latest story time (newest first)
        validUsers.sort((a, b) => {
            const latestA = Math.max(...a.stories.map(s => new Date(s.created_at).getTime()));
            const latestB = Math.max(...b.stories.map(s => new Date(s.created_at).getTime()));
            return latestB - latestA;
        });

        return validUsers;
    }

    // async getVideosFeed(
    //     userId: string,
    //     feedType: 'followings' | 'news' | 'explore',
    //     page = 1,
    //     limit = 10,

    // ) {
    //     const skip = (page - 1) * limit;
    //     const query = this.videoRepository
    //         .createQueryBuilder('video')
    //         .leftJoinAndSelect('video.user_id', 'user')
    //         .leftJoinAndSelect('user.userProfile', 'userProfile')
    //         .leftJoinAndSelect('video.audio', 'audio')
    //         .leftJoinAndSelect('video.hashtags', 'hashtags')
    //         .leftJoinAndSelect('video.likes', 'likes')
    //         .leftJoinAndSelect('video.comments', 'comments')
    //         .leftJoinAndSelect('video.views', 'views')
    //         .where('video.type != :storyType', { storyType: 'story' });
    //     if (feedType === 'followings') {
    //         const followings = await this.followRepository.find({
    //             where: { follower: { id: userId } },
    //             relations: ['following'],
    //         });

    //         const followingIds = followings.map(f => f.following.id);

    //         if (followingIds.length === 0) {
    //             return { data: [], page, limit, total: 0 };
    //         }

    //         query.andWhere('video.user_id IN (:...followingIds)', { followingIds });
    //         query.orderBy('video.created_at', 'DESC');
    //     }
    //     else if (feedType === 'news') {
    //         query.andWhere('video.type = :newsType', { newsType: 'news' });
    //         query.orderBy('video.created_at', 'DESC');
    //     }
    //     else if (feedType === 'explore') {
    //         query.andWhere('(video.type = :reelsType OR video.type = :newsType)', { reelsType: 'reels', newsType: 'news' });
    //         // query.orderBy('RANDOM()');
    //     }
    //     query.skip(skip).take(limit);
    //     const [videos, total] = await query.getManyAndCount();
    //     const formatted = videos.map(v => ({
    //         id: v.uuid,
    //         title: v.title,
    //         caption: v.caption,
    //         videoUrl: v.videoUrl,
    //         type: v.type,
    //         created_at: v.created_at,
    //         thumbnailUrl: v.thumbnailUrl,
    //         duration: v.duration || 15,
    //         user: {
    //             id: v.user_id.id,
    //             username: v.user_id.username,
    //             profilePic: v.user_id.userProfile?.ProfilePicture || '',
    //         },
    //         audio: v.audio ? { id: v.audio.uuid, title: v.audio.name } : null,
    //         hashtags: v.hashtags?.map(h => h.tag) || [],
    //         likesCount: v.likes?.length || 0,
    //         viewsCount: v.views?.length || 0,
    //         commentsCount: v.comments?.length || 0,
    //     }));

    //     console.log('Video durations:', formatted.map(v => ({
    //         duration: v.duration
    //     })));

    //     return {
    //         data: formatted,
    //         page,
    //         limit,
    //         total,
    //         totalPages: Math.ceil(total / limit),
    //     };
    // }
    async getVideosFeed(
        userId: string,
        feedType: 'followings' | 'news' | 'explore',
        page = 1,
        limit = 10,
        random = false // 👈 NEW FLAG
    ) {
        const skip = (page - 1) * limit;

        const query = this.videoRepository
            .createQueryBuilder('video')
            .leftJoinAndSelect('video.user_id', 'user')
            .leftJoinAndSelect('user.userProfile', 'userProfile')
            .leftJoinAndSelect('video.audio', 'audio')
            .leftJoinAndSelect('video.hashtags', 'hashtags')
            .leftJoinAndSelect('video.likes', 'likes')
            .leftJoinAndSelect('video.comments', 'comments')
            .leftJoinAndSelect('video.views', 'views')
            .leftJoin(
                'video.likes',
                'myLike',
                'myLike.user.id = :userId',
                { userId }
            )

            .where('video.type != :storyType', { storyType: 'story' });

        /* ================= FEED TYPE LOGIC ================= */

        if (feedType === 'followings') {
            const followings = await this.followRepository.find({
                where: { follower: { id: userId } },
                relations: ['following'],
            });

            const followingIds = followings.map(f => f.following.id);

            if (!followingIds.length) {
                return { data: [], page, limit, total: 0, totalPages: 0 };
            }

            query.andWhere('video.user_id IN (:...followingIds)', { followingIds });

        } else if (feedType === 'news') {
            query.andWhere('video.type = :newsType', { newsType: 'news' });

        } else if (feedType === 'explore') {
            query.andWhere(
                '(video.type = :reelsType OR video.type = :newsType)',
                { reelsType: 'reels', newsType: 'news' }
            );
        }

        /* ================= ORDERING LOGIC ================= */

        if (random) {
            // PostgreSQL → RANDOM(), MySQL → RAND()
            query.orderBy('RANDOM()');
        } else {
            query.orderBy('video.created_at', 'DESC');
        }

        /* ================= PAGINATION ================= */

        query.skip(skip).take(limit);

        const [videos, total] = await query.getManyAndCount();

        /* ================= RESPONSE FORMAT ================= */

        const formatted = videos.map(v => ({
            id: v.uuid,
            title: v.title,
            caption: v.caption,
            videoUrl: v.videoUrl,
            type: v.type,
            created_at: v.created_at,
            thumbnailUrl: v.thumbnailUrl,
            duration: v.duration || 15,
            user: {
                id: v.user_id.id,
                username: v.user_id.username,
                profilePic: v.user_id.userProfile?.ProfilePicture || '',
            },
            audio: v.audio ? { id: v.audio.uuid, title: v.audio.name } : null,
            hashtags: v.hashtags?.map(h => h.tag) || [],
            likesCount: v.likes?.length || 0,
            viewsCount: v.views?.length || 0,
            commentsCount: v.comments?.length || 0,
        }));

        return {
            data: formatted,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            random, // 👈 helpful for frontend
        };
    }

    async getExploreVideosWithMain(
        videoId: string,
        limit = 10
    ) {
        // Fetch the main video first
        const mainVideo = await this.videoRepository
            .createQueryBuilder('video')
            .leftJoinAndSelect('video.user_id', 'user')
            .leftJoinAndSelect('user.userProfile', 'userProfile')
            .leftJoinAndSelect('video.audio', 'audio')
            .leftJoinAndSelect('video.hashtags', 'hashtags')
            .leftJoinAndSelect('video.likes', 'likes')
            .leftJoinAndSelect('video.views', 'views')
            .where('video.uuid = :videoId', { videoId })
            .andWhere('video.type IN (:...types)', { types: ['reels', 'news'] })
            .getOne();

        if (!mainVideo) {
            return { data: [], total: 0 };
        }

        // Now fetch 9 random explore videos excluding the main one
        const otherVideosQuery = this.videoRepository
            .createQueryBuilder('video')
            .leftJoinAndSelect('video.user_id', 'user')
            .leftJoinAndSelect('user.userProfile', 'userProfile')
            .leftJoinAndSelect('video.audio', 'audio')
            .leftJoinAndSelect('video.hashtags', 'hashtags')
            .leftJoinAndSelect('video.likes', 'likes')
            .leftJoinAndSelect('video.views', 'views')
            .where('video.type IN (:...types)', { types: ['reels', 'news'] })
            .andWhere('video.uuid != :videoId', { videoId })
            .orderBy('RANDOM()')
            .take(limit - 1);

        const otherVideos = await otherVideosQuery.getMany();

        // Combine main + others
        const videos = [mainVideo, ...otherVideos];

        // Format output same as before
        const formatted = videos.map(v => ({
            id: v.uuid,
            title: v.title,
            caption: v.caption,
            videoUrl: v.videoUrl,
            type: v.type,
            created_at: v.created_at,
            thumbnailUrl: v.thumbnailUrl,
            user: {
                id: v.user_id.id,
                username: v.user_id.username,
                profilePic: v.user_id.userProfile?.ProfilePicture || '',
            },
            audio: v.audio ? { id: v.audio.uuid, title: v.audio.name } : null,
            hashtags: v.hashtags?.map(h => h.tag) || [],
            likesCount: v.likes?.length || 0,
            viewsCount: v.views?.length || 0,
        }));
        return {
            data: formatted,
            total: formatted.length,
        };
    }



    async deleteVideoById(uuid: string) {
        const video = await this.videoRepository.findOne({ where: { uuid } });
        if (!video) throw new NotFoundException('Video not found');

        await this.videoRepository.remove(video);
        return { success: true };
    }
}


