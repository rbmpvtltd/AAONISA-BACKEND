export class ChatResponseDto {
  chatId: number;
  sender: {
    id: string;
    username: string;
  };
  messageText: string;
  createdAt: Date;
}
