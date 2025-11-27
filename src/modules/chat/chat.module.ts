import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Chat } from './entities/chat.entity';
import { ChatSession } from './entities/chat-session.entity';
import { User } from '../users/entities/user.entity';


@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, Chat, User]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
