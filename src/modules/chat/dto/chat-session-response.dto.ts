import { ChatResponseDto } from './chat-response.dto';

export class ChatSessionResponseDto {
  sessionId: number;
  user1: { id: string; username: string };
  user2: { id: string; username: string };
  createdAt: Date;
  messages?: ChatResponseDto[]; // optional, last few messages include kar sakte ho
}
