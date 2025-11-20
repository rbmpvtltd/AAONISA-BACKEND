import { IsInt, IsNotEmpty } from 'class-validator';

export class ChatCreateDto {
  @IsInt()
  sessionId: number; // kaunse chat session me message

  @IsNotEmpty()
  messageText: string; // message content
}
