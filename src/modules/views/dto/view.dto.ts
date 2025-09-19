// src/view/dto/view.dto.ts

import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ViewDto {
  @ApiProperty({ type: 'string', format: 'uuid' })
  @IsUUID()
  reel_id: string;
}
