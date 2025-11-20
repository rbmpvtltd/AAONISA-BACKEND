import { IsUUID } from 'class-validator';

export class ChatSessionCreateDto {
  @IsUUID()
  user2Id: string; // receiver ka ID, sender JWT se milega backend me
}
