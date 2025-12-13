import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Video } from 'src/modules/stream/entities/video.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CommentService } from './comments.service';
import { CommentController } from './comments.controller';
import { SharedModule } from 'src/modules/shared/shared.module';
import { TokenModule } from '../tokens/token.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Video, User]), SharedModule,TokenModule, NotificationModule],
  providers: [CommentService],
  controllers: [CommentController],
  exports: [CommentService],
})
export class CommentModule {}
