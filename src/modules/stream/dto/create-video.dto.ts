import { IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum VideoType {
  story = 'story',
  reels = 'reels',
  news = 'news',
}

export class MusicDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  uri?: string;

  @IsOptional()
  @IsString()
  startMs?: string;

  @IsOptional()
  @IsString()
  endMs?: string;

  @IsOptional()
  @IsString()
  volume?: string;
}

export class CreateVideoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => MusicDto)
  music?: MusicDto;

  @IsOptional()
  @IsString()
  filter?: string;

  @IsEnum(VideoType)
  type: VideoType;


  @IsString()
  trimStart: string;

  @IsString()
  trimEnd: string;

  @IsString()
  videoVolume: string;

  @IsOptional()
  overlays?: any; // optional, can be JSON object/array
}
