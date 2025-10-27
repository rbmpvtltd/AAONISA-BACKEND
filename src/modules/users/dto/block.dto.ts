import { IsString } from 'class-validator';

export class BlockUserDto {
  @IsString()
  username: string; // username of user to block/unblock
}
