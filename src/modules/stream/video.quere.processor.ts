import { OnQueueActive, OnQueueCompleted, OnQueueFailed, Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { VideoService } from "./stream.service";

@Processor('videoProcessing')
export class VideoQueueProcessor {
    constructor(private readonly videoService: VideoService) {}
    @OnQueueActive()
onActive(job: Job) {
  console.log('🟢 JOB ACTIVE', job.id);
}

@OnQueueFailed()
onFailed(job: Job, err: Error) {
  console.error('🔴 JOB FAILED', job.id, err.message);
}

@OnQueueCompleted()
onComplete(job: Job) {
  console.log('✅ JOB COMPLETED', job.id);
}

    @Process({name:'PROCESS_VIDEO',concurrency:2})
    async handle(job: Job) {
        console.log('🎬 VIDEO JOB RECEIVED', job.id);
        try {
    await this.videoService.processVideoJob(job.data);
  } catch (e) {
    console.error('❌ VIDEO JOB FAILED', e);
  }
    }
}
