import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Report } from './entities/report.entity';
import { User } from '../users/entities/user.entity';
import { Video } from '../stream/entities/video.entity';

import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Report,
      User,
      Video,
    ]),
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService], // ✅ agar future me aur modules use karein
})
export class ReportModule {}
