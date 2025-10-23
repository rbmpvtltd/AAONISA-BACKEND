// src/bookmark/bookmark.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
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
  ) {}

  // 🟢 Create new bookmark
  async create(userId: string, dto: CreateBookmarkDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.bookmarkRepo.findOne({
      where: { name: dto.name, user: { id: userId } },
    });
    if (existing) throw new ConflictException('Bookmark name already exists for this user');

    const reels = dto.reelIds?.length
      ? await this.reelRepo.find({ where: { uuid: In(dto.reelIds) } })
      : [];

    const bookmark = this.bookmarkRepo.create({
      name: dto.name,
      user,
      reels,
    });

    return this.bookmarkRepo.save(bookmark);
  }

  // 🟣 Find all bookmarks for a user
  async findAll(userId: string) {
    return this.bookmarkRepo.find({
      where: { user: { id: userId } },
      relations: ['reels'],
    });
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
  async update(userId: string, id: number, dto: UpdateBookmarkDto) {
    const bookmark = await this.findOne(userId, id);

    if (dto.name) {
      const existing = await this.bookmarkRepo.findOne({
        where: { name: dto.name, user: { id: userId } },
      });
      if (existing && existing.id !== id)
        throw new ConflictException('Bookmark name already exists for this user');
      bookmark.name = dto.name;
    }

    if (dto.reelIds) {
      const reels = await this.reelRepo.find({ where: { uuid: In(dto.reelIds) } });
      bookmark.reels = reels;
    }

    return this.bookmarkRepo.save(bookmark);
  }

  // 🔴 Remove
  async remove(userId: string, id: number) {
    const bookmark = await this.findOne(userId, id);
    return this.bookmarkRepo.remove(bookmark);
  }
}
