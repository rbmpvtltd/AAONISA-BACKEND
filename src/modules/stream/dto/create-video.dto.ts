import { IsString, IsEnum, IsUUID, IsOptional, IsArray } from 'class-validator';
import { VideoType } from '../entities/video.entity';

export class CreateVideoDto {

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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

}
