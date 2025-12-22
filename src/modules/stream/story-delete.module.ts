// story-delete.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { StoryDeleteProcessor } from './story-delete.processor';
import { HashtagCleanupProcessor } from './hashtag-cleanup.processor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from 'src/modules/stream/entities/video.entity';
import { Hashtag } from './entities/hashtag.entity';
@Module({
    imports: [
        BullModule.registerQueue({
            name: 'story-delete',
        }),
        BullModule.registerQueue({
            name: 'hashtag-cleanup',
        }),
        // BullModule.registerQueue({
        //     name : 'videoProcessing'
        // }),
        TypeOrmModule.forFeature([Hashtag]),
        TypeOrmModule.forFeature([Video]),
    ],
    providers: [StoryDeleteProcessor, HashtagCleanupProcessor],
    exports: [BullModule],
})
export class StoryDeleteModule { }
