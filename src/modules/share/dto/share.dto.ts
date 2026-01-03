// src/view/dto/share.dto.ts

import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShareDto {
  @ApiProperty({ type: 'string', format: 'uuid' })
  @IsUUID()
  reel_id: string;

  @ApiProperty({ type: 'string', format: 'uuid' })
  @IsUUID()
  shared_to_user_id: string;
}
