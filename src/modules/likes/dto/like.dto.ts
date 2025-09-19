import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LikeDto {
  @ApiProperty({ type: 'string', format: 'uuid' })
  @IsUUID()
  reel_id: string;
}