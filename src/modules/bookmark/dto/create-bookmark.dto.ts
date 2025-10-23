
import { IsNotEmpty, IsString, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateBookmarkDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  // Optional: list of reel IDs to link
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  reelIds?: number[];
}
