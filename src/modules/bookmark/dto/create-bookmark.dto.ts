
import { IsNotEmpty, IsString, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateBookmarkDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  reelId?: string;
}
