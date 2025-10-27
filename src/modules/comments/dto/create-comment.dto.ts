import { IsInt, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsString()
  postId: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[]; // user IDs mentioned
}
