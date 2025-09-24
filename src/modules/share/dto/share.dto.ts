// src/view/dto/share.dto.ts

import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShareDto {
  @ApiProperty({ type: 'string', format: 'uuid' })
  @IsUUID()
  reel_id: string;
}
