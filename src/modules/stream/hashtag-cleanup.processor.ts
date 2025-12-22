import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { Video } from 'src/modules/stream/entities/video.entity';
import { Hashtag } from 'src/modules/stream/entities/hashtag.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
@Processor('hashtag-cleanup')
export class HashtagCleanupProcessor {
  private readonly logger = new Logger(HashtagCleanupProcessor.name);

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,

    @InjectRepository(Hashtag)
    private readonly hashtagRepo: Repository<Hashtag>,
  ) {}

  @Process('removeVideoFromHashtags')
  async handleRemoveVideoFromHashtags(job: Job) {
    const { videoId, hashtagIdentifiers } = job.data;
    this.logger.log(`Running hashtag cleanup for video ${videoId}`);

    // fetch video with relations to hashtags
    const video = await this.videoRepository.findOne({
      where: { uuid: videoId },
      relations: ['hashtags'],
    });

    if (!video) {
      this.logger.warn(`Video not found during hashtag cleanup: ${videoId}`);
      return;
    }

    if (!video.hashtags || !video.hashtags.length) {
      this.logger.log(`No hashtags to clean for video ${videoId}`);
      return;
    }

    // Filter out hashtags to be removed for this video (match by id/uuid/tag)
    const identifiersSet = new Set(hashtagIdentifiers.map(String));

    const remainingHashtags = video.hashtags.filter(h => {
      const identifier = h.id; // adapt to your model
      return !identifiersSet.has(String(identifier));
    });

    // If nothing changed, still ok
    if (remainingHashtags.length === video.hashtags.length) {
      this.logger.log(`No matching hashtags found to remove for video ${videoId}`);
      return;
    }

    // Update association: set remaining hashtags and save
    video.hashtags = remainingHashtags;
    await this.videoRepository.save(video);

    // OPTIONAL: cleanup orphan hashtags (if hashtag has no videos left -> delete)
    for (const idOrTag of hashtagIdentifiers) {
      let hashtag: Hashtag | null = null;
      // find hashtag by id/uuid/tag (adapt as required)
      hashtag = await this.hashtagRepo.findOne({
        where: [{ id: idOrTag }, { tag: idOrTag }],
        relations: ['videos'],
      });

      if (!hashtag) continue;

      if (!hashtag.videos || hashtag.videos.length === 0) {
        try {
          await this.hashtagRepo.remove(hashtag);
          this.logger.log(`Removed orphan hashtag ${hashtag.tag ?? hashtag.id}`);
        } catch (err) {
          this.logger.warn(`Failed to remove orphan hashtag ${hashtag.tag ?? hashtag.id}: ${err.message}`);
        }
      } else {
        // If ORM relation not updated to remove video, ensure removal there as well
        hashtag.videos = hashtag.videos.filter(v => v.uuid !== videoId);
        await this.hashtagRepo.save(hashtag);
      }
    }

    this.logger.log(`Hashtag cleanup completed for video ${videoId}`);
  }
}
