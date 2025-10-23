import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { Audio } from './entities/audio.entity';
import { VideoService } from './stream.service';
import { VideoController } from './stream.controller';
import { User } from '../users/entities/user.entity';
import { UserProfileModule } from '../users/user.module';
import { Hashtag } from './entities/hashtag.entity';
import { AppGateway } from 'src/app.gateway';
import { UploadService } from '../upload/upload.service';
@Module({
  imports: [TypeOrmModule.forFeature([Video, Audio,User,Hashtag]),UserProfileModule],
  controllers: [VideoController],
  providers: [VideoService,AppGateway,UploadService],
})
export class StreamModule {}
