import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { VideoService } from "./stream.service";

@Processor('videoProcessing')
export class VideoQueueProcessor {
    constructor(private readonly videoService: VideoService) {}

    @Process('PROCESS_VIDEO')
    async handle(job: Job) {
        console.log('🎬 VIDEO JOB RECEIVED', job.id);
        await this.videoService.processVideoJob(job.data);
    }
}
