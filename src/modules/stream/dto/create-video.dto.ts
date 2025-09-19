import { IsString, IsEnum, IsUUID, IsOptional, IsArray } from 'class-validator';
import { VideoType } from '../entities/video.entity';

export class CreateVideoDto {
  // @IsString()
  // user_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsArray()
  hashtags: string[];

  @IsUUID()
  audioId: string;

  @IsUUID()
  filterId: string;

  @IsString()
  audio_trim_from: string;

  @IsString()
  audio_trim_to: string;

  @IsEnum(VideoType)
  type: VideoType;
}
