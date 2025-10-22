import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class HashtagCleanupService {
  private readonly logger = new Logger(HashtagCleanupService.name);

  constructor(private readonly dataSource: DataSource) {}

  // Runs every midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldRelations() {
    this.logger.log('Running hashtag relation cleanup...');

    await this.dataSource.query(`
      DELETE FROM video_hashtags_hashtag
      WHERE "videoUuid" IN (
        SELECT v.uuid FROM video v WHERE v.created_at < NOW() - INTERVAL '7 days'
      );
    `);

    this.logger.log('Old video-hashtag relations cleaned.');
  }
}
