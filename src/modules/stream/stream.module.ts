import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { Audio } from './entities/audio.entity';
import { VideoService } from './stream.service';
import { VideoController } from './stream.controller';
import { User } from '../users/entities/user.entity';
import { UserProfileModule } from '../users/user.module';
import { AppGateway } from 'src/app.gateway';
@Module({
  imports: [TypeOrmModule.forFeature([Video, Audio,User]),UserProfileModule],
  controllers: [VideoController],
  providers: [VideoService,AppGateway],
})
export class StreamModule {}
