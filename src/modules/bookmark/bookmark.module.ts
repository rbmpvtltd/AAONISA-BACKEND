import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookmarkService } from './bookmark.service';
import { BookmarkController } from './bookmark.controller';
import { Bookmark } from './entities/bookmark.entity';
import { User } from '../users/entities/user.entity';
import { Video } from '../stream/entities/video.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bookmark, User, Video]), // repositories register karo
  ],
  controllers: [BookmarkController],
  providers: [BookmarkService],
  exports: [BookmarkService], // optional, agar kisi aur module me use karna ho
})
export class BookmarkModule {}
