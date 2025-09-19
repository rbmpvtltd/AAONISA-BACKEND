import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFollowDto {
  @IsUUID()
  following: string;
}

export class UnfollowDto {
  @IsUUID()
  following: string;
}