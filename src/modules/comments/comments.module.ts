import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Video } from 'src/modules/stream/entities/video.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CommentService } from './comments.service';
import { CommentController } from './comments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Video, User])],
  providers: [CommentService],
  controllers: [CommentController],
  exports: [CommentService],
})
export class CommentModule {}
