// story-delete.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from 'src/modules/stream/entities/video.entity';
import { Logger } from '@nestjs/common';

@Processor('story-delete')
export class StoryDeleteProcessor {
  private readonly logger = new Logger(StoryDeleteProcessor.name);

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  @Process()
  async handleStoryDelete(job: Job<{ videoId: string }>) {
    const { videoId } = job.data;
    this.logger.log(`Deleting story (ID: ${videoId}) after 24 hours...`);

    const video = await this.videoRepository.findOne({ where: { uuid: videoId } });
    if (!video) return;

    await this.videoRepository.delete(videoId);

    // ❗ Cloudflare deletion logic (keep commented)
    /*
    try {
      await this.cloudflareService.deleteVideoFromCloudflare(video.cloudflareId);
    } catch (err) {
      this.logger.warn(`Failed to delete story from Cloudflare: ${err.message}`);
    }
    */

    this.logger.log(`Story deleted successfully (ID: ${videoId})`);
  }
}
