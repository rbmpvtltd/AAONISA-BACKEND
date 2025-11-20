import { Controller, Post, Get, Delete, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatSessionCreateDto } from './dto/chat-session-create.dto';
import { ChatCreateDto } from './dto/chat-create.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';


@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ---------------- ChatSession Endpoints ----------------

  // Create new chat session
  @Post('sessions')
  createSession(@Req() req, @Body() dto: ChatSessionCreateDto) {
    const payload = req.user;
    const senderId = payload?.sub || payload?.id || payload?.userId;
    return this.chatService.createSession(senderId, dto.user2Id);
  }

  // Get all sessions of logged-in user with latest message
  @Get('sessions')
  getSessions(@Req() req) {
    const payload = req.user;
    const userId = payload?.sub || payload?.id || payload?.userId;
    return this.chatService.getUserSessionsWithLatestMessage(userId);
  }

  // Delete a chat session
  @Delete('sessions/:id')
  deleteSession(@Param('id') sessionId: number, @Req() req) {
    const payload = req.user;
    const userId = payload?.sub || payload?.id || payload?.userId;
    return this.chatService.deleteSession(userId, sessionId);
  }

  // ---------------- Chat Endpoints ----------------

  // Send a new message
  @Post('messages')
  createMessage(@Req() req, @Body() dto: ChatCreateDto) {
    const payload = req.user;
    const senderId = payload?.sub || payload?.id || payload?.userId;
    return this.chatService.sendMessage(senderId, dto.sessionId, dto.messageText);
  }

  // Get messages for a session with optional limit (default: 1 day)
  @Get('messages/session/:sessionId')
  getMessages(
    @Param('sessionId') sessionId: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getSessionMessages(sessionId, limit);
  }

  // Delete a message
  @Delete('messages/:id')
  deleteMessage(@Param('id') chatId: number, @Req() req) {
    const payload = req.user;
    const userId = payload?.sub || payload?.id || payload?.userId;
    return this.chatService.deleteMessage(userId, chatId);
  }
}
