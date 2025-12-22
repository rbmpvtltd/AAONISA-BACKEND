import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { Audio } from './entities/audio.entity';
import { VideoService } from './stream.service';
import { VideoController } from './stream.controller';
import { User } from '../users/entities/user.entity';
import { UserProfileModule } from '../users/user.module';
import { Hashtag } from './entities/hashtag.entity';
import { SharedModule } from 'src/modules/shared/shared.module';
import { UploadService } from '../upload/upload.service';
import { BullModule } from '@nestjs/bull';
import { Follow } from '../follows/entities/follow.entity';
import { TokenModule } from '../tokens/token.module';
import { NotificationModule } from '../notifications/notification.module';
import { StoryDeleteModule } from './story-delete.module';
import { VideoQueueProcessor } from './video.quere.processor';
@Module({
  imports: [TypeOrmModule.forFeature([Video, Audio,User,Hashtag,Follow]),UserProfileModule,SharedModule,TokenModule,NotificationModule,StoryDeleteModule,
  BullModule.registerQueue({
            name : 'videoProcessing'
        }),],
  controllers: [VideoController],
  providers: [VideoService,UploadService,VideoQueueProcessor],
})
export class StreamModule {}
