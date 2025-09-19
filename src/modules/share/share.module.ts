import { Module } from '@nestjs/common';
import { ShareService } from './share.service';
import { ShareController } from './share.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Share } from './entities/share.entity';
import { Video } from '../stream/entities/video.entity';
@Module({
    imports: [TypeOrmModule.forFeature([Share,Video])], 
  controllers: [ShareController],
  providers: [ShareService],
})
export class ShareModule {}
