// src/bookmark/bookmark.service.ts
import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Bookmark } from './entities/bookmark.entity';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { User } from '../users/entities/user.entity';
import { Video } from '../stream/entities/video.entity';

@Injectable()
export class BookmarkService {
    constructor(
        @InjectRepository(Bookmark)
        private readonly bookmarkRepo: Repository<Bookmark>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Video)
        private readonly reelRepo: Repository<Video>,
    ) { }

    // 🟢 Create new bookmark
    async create(userId: string, dto: CreateBookmarkDto) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const existing = await this.bookmarkRepo.findOne({
            where: { name: dto.name, user: { id: userId } },
        });
        if (existing) throw new ConflictException('Bookmark name already exists for this user');

        // const reels = dto.reelId?.length
        //   ? await this.reelRepo.find({ where: { uuid: dto.reelId } })
        //   : [];

        const bookmark = this.bookmarkRepo.create({
            name: dto.name,
            user,
            //   reels,
        });

        return this.bookmarkRepo.save(bookmark);
    }

    // 🟣 Find all bookmarks for a user
    //     async findAll(userId: string) {
    //     const bookmarks = await this.bookmarkRepo.find({
    //         where: { user: { id: userId } },
    //         relations: [
    //             'reels',
    //             'reels.likes',
    //             'reels.comments',
    //             'reels.views',
    //             'reels.mentions',
    //             'reels.hashtags',
    //             'reels.user_id',
    //             'reels.user_id.userProfile',
    //         ],
    //     });

    //     const transformed = bookmarks.map(bookmark => ({
    //         id: bookmark.id,
    //         name: bookmark.name,
    //         reels: bookmark.reels.map(reel => ({
    //             uuid: reel.uuid,
    //             user: {
    //                 userProfile: reel.user_id.userProfile.ProfilePicture,
    //                 username: reel.user_id.username
    //             },
    //             title: reel.title,
    //             caption: reel.caption,
    //             videoUrl: reel.videoUrl,
    //             thumbnailUrl: reel.thumbnailUrl,
    //             externalAudioSrc: reel.externalAudioSrc,
    //             type: reel.type,
    //             duration: reel.duration,
    //             audio_trim_from: reel.audio_trim_from,
    //             audio_trim_to: reel.audio_trim_to,
    //             created_at: reel.created_at,
    //             archived: reel.archived,
    //             likes: {
    //                 count: reel.likes.length,
    //                 likedByMe: reel.likes.some(like => like.user.id === userId)
    //             },
    //             views: reel.views,
    //             mentions: reel.mentions,
    //             hashtags: reel.hashtags,
    //             comments_count:reel.comments.length,
    //             comments: reel.comments
    //         }))
    //     }));

    //     return transformed;
    // }

    async findAll(userId: string) {
        //     return this.bookmarkRepo.find({
        //         where: { user: { id: userId } },
        //         relations: ['reels','reels.likes','reels.comments', 'reels.views', 'reels.mentions','reels.hashtags'],
        //     });
        // }
        const bookmarks = await this.bookmarkRepo.find({
            where: { user: { id: userId } },
            relations: [
                'reels',
                'reels.likes',
                'reels.comments',
                'reels.views',
                'reels.mentions',
                'reels.hashtags',
                'reels.user_id',
                'reels.user_id.userProfile',
            ],
        });
        console.log(bookmarks[0].reels[0].user_id.userProfile)
        const transformed = bookmarks.map(bookmark => ({
            id: bookmark.id,
            name: bookmark.name,
            reels: bookmark.reels.map(reel => ({
                uuid: reel.uuid,
                user: {
                    userProfile: reel.user_id.userProfile?.ProfilePicture ?? null,
                    username: reel.user_id.username,
                    role:reel.user_id.role || 'user'
                },

                title: reel.title,
                caption: reel.caption,
                videoUrl: reel.videoUrl,
                thumbnailUrl: reel.thumbnailUrl,
                externalAudioSrc: reel.externalAudioSrc,
                type: reel.type,
                duration: reel.duration,
                audio_trim_from: reel.audio_trim_from,
                audio_trim_to: reel.audio_trim_to,
                created_at: reel.created_at,
                archived: reel.archived,
                likes: {
                    count: reel.likes.length
                },
                views: reel.views,
                mentions: reel.mentions,
                hashtags: reel.hashtags,
                comments_count: reel.comments.length,
                comments: reel.comments
            }))
        }));

        return transformed;
    }
    // 🔵 Find one
    async findOne(userId: string, id: number) {
        const bookmark = await this.bookmarkRepo.findOne({
            where: { id, user: { id: userId } },
            relations: ['reels'],
        });
        if (!bookmark) throw new NotFoundException('Bookmark not found');
        return bookmark;
    }

    // 🟠 Update
    async update(userId: string, dto: UpdateBookmarkDto) {
        const bookmark = await this.findOne(userId, dto.id);

        if (dto.name) {
            const existing = await this.bookmarkRepo.findOne({
                where: { name: dto.name, user: { id: userId } },
            });
            if (existing && existing.id !== dto.id)
                throw new ConflictException('Bookmark name already exists for this user');
            bookmark.name = dto.name;
        }

        // if (dto.reelId) {
        //   const reels = await this.reelRepo.find({ where: { uuid: dto.reelId } });
        //   bookmark.reels = reels;
        // }

        return this.bookmarkRepo.save(bookmark);
    }

    // 🔴 Remove
    async remove(userId: string, id: number) {
        const bookmark = await this.findOne(userId, id);
        return this.bookmarkRepo.remove(bookmark);
    }

    async addReel(userId: string, dto: CreateBookmarkDto) {

        const user = await this.userRepo.findOne({
            where: { id: userId },
        });
        if (!user) throw new NotFoundException('User not found');

        // Bookmark dhundo jisme add karna hai
        const bookmark = await this.bookmarkRepo.findOne({
            where: { name: dto.name, user: { id: userId } },
            relations: ['reels'], // important
        });
        if (!bookmark) throw new NotFoundException('Bookmark not found');
        if (!dto.reelId) throw new BadRequestException('No reel IDs provided to add')
        // Nayi reels lao
        const newReels = await this.reelRepo.find({
            where: { uuid: dto.reelId },
        });

        if (!newReels) throw new NotFoundException('Reel not found');

        // Purani + nayi reels combine karo
        bookmark.reels = [...bookmark.reels, ...newReels];
        await this.bookmarkRepo.save(bookmark);

        return bookmark;
    }

    // async addReel(userId: string, dto: CreateBookmarkDto) {
    //     const user = await this.userRepo.findOne({ where: { id: userId } });
    //     if (!user) throw new NotFoundException('User not found');

    //     const bookmark = await this.bookmarkRepo.findOne({
    //         where: { name: dto.name, user: { id: userId } },
    //         relations: ['reels'],
    //     });

    //     if (!bookmark) throw new NotFoundException('Bookmark not found');

    //     // Sirf EK reel fetch karo, array nahi
    //     const reel = await this.reelRepo.findOne({
    //         where: { uuid: dto.reelId },
    //     });

    //     if (!reel) throw new NotFoundException('Reel not found');

    //     // Duplicate check
    //     const alreadyExists = bookmark.reels.some(r => r.uuid === reel.uuid);
    //     if (alreadyExists) return bookmark;

    //     // Sirf ek reel push karo
    //     bookmark.reels.push(reel);

    //     return await this.bookmarkRepo.save(bookmark);
    // }


    async removeReel(userId: string, dto: CreateBookmarkDto) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
        });
        console.log("bookmark name ", dto)
        if (!user) throw new NotFoundException('User not found');
        const bookmark = await this.bookmarkRepo.findOne({
            where: { name: dto.name, user: { id: userId } },
            relations: ['reels'], // zaruri hai
        });
        if (!bookmark) throw new NotFoundException('Bookmark not found');
        console.log("reelId ", dto.reelId)
        if (!dto.reelId?.length) {
            throw new BadRequestException('No reel IDs provided to remove');
        }

        // Sirf un reels ko rakho jo remove nahi karni hain
        if (!dto.reelId) throw new BadRequestException('No reel IDs provided to remove');

        bookmark.reels = bookmark.reels.filter((reel) => reel.uuid !== dto.reelId);
        await this.bookmarkRepo.save(bookmark);

        return {
            message: 'Reels removed successfully',
            remainingReels: bookmark.reels.map((r) => r.uuid),
        };
    }

}
