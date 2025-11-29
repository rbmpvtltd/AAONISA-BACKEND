
// import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';

// @WebSocketGateway({
//   cors: { origin: '*' },
//   namespace:'/socket.io'
// })

// export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer()
//   server: Server;
//   private sockets: Set<string> = new Set();

//   @SubscribeMessage('send_message')
//   handleSendMessage(
//     @MessageBody() data: { message: string },
//     @ConnectedSocket() client: Socket
//   ) {
//     this.server.emit('receive_message', data);

//     return { status: 'ok' };
//   }
//   handleConnection(client: Socket) {
//     this.sockets.add(client.id);
//     console.log(`⚡ New client connected: ${client.id}`);
//   }

//   handleDisconnect(client: Socket) {
//     this.sockets.delete(client.id);
//     console.log(`❌ Client disconnected: ${client.id}`);
//   }

//   // Broadcast to all connected sockets
//   broadcast(event: string, data: any) {
//     this.server.emit(event, data);
//   }

//   // Send to specific socketId
//   emitToSocket(socketId: string, event: string, data: any) {
//     this.server.to(socketId).emit(event, data);
//   }

//   // Optional: get all connected socketIds
//   getAllSockets() {
//     return Array.from(this.sockets);
//   }
// }

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { log } from 'console';
import { Server, Socket } from 'socket.io';
import { ChatService } from './modules/chat/chat.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/socket.io',
  // namespace: '/'
})

export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  constructor(private readonly chatService: ChatService) { }
  private users: Map<string, string> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.users.set(userId, client.id);
      console.log(`User ${userId} connected with socket ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    [...this.users.entries()].forEach(([userId, socketId]) => {
      if (socketId === client.id) {
        this.users.delete(userId);
      }
    });
  }

  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.users.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
    console.log(data);

  }

  // JOIN ROOM
  @SubscribeMessage("joinRoom")
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    const roomId = data.roomId;
    console.log("User joining room:", roomId);
    client.join(roomId);
  }

  @SubscribeMessage("leaveRoom")
  handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    const roomId = data.roomId;
    console.log("🔴 User leaving room:", roomId);
    client.leave(roomId);
  }
  @SubscribeMessage("sendMessage")
  async handleSendMessage(
    @MessageBody() msg: { sessionId: number; senderId: string; receiverId: string; text: string },
    @ConnectedSocket() client: Socket
  ) {
    const roomId = [msg.senderId, msg.receiverId].sort().join("-");

    console.log("📤 Sending to room:", roomId, msg);

    // Save to DB
    const saved = await this.chatService.sendMessage(
      msg.senderId,
      msg.sessionId,
      msg.text
    );

    // ✅ Emit with the REAL DB message_id
    this.server.to(roomId).emit("Message", {
      message_id: saved.chat_id,        // This is the real DB ID
      text: saved.message_text,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      createdAt: saved.created_at,
    });
  }


  @SubscribeMessage('getPreviousMessages')
  async handleGetPreviousMessages(
    @MessageBody() data: { user1Id: string; user2Id: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { user1Id, user2Id } = data;

      console.log('📥 Fetching for User1:', user1Id, 'User2:', user2Id);

      const session = await this.chatService.createSession(user1Id, user2Id);

      // ✅ CRITICAL: Make sure getSessionMessages includes sender relation
      const messages = await this.chatService.getSessionMessages(
        session.session_id
      );

      console.log('📦 Found messages:', messages.length);
      console.log('📦 First message sample:', messages[0]); // Debug log

      const roomId = [user1Id, user2Id].sort().join("-");

      // ✅ Send messages to the room
      this.server.to(roomId).emit("previousMessages", {
        sessionId: session.session_id,
        messages  // This should contain the messages array
      });

      console.log(`📜 Sent ${messages.length} messages to room ${roomId}`);
    } catch (error) {
      console.error('❌ Error fetching previous messages:', error);
      console.error('❌ Error stack:', error.stack);
    }
  }

  @SubscribeMessage("deleteMessageForMe")
  async handleDeleteForMe(
    @MessageBody() data: { messageId: string; userId: string; roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    console.log("🗑️ Delete for me:", data);

    await this.chatService.deleteMessageForMe(data.userId, data.messageId);

    // Only notify the user who deleted it
    client.emit("messageDeletedForMe", { messageId: data.messageId });
  }

  @SubscribeMessage("deleteMessageForEveryone")
  async handleDeleteForEveryone(
    @MessageBody() data: { messageId: string; userId: string; roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    console.log("🗑️ Delete for everyone:", data);

    await this.chatService.deleteMessageForEveryone(data.userId, data.messageId);

    // Notify entire room
    this.server.to(data.roomId).emit("messageDeleted", {
      messageId: data.messageId,
      deletedForEveryone: true,
    });
  }

  broadcast(event: string, data: any) {

    this.server.emit(event, data);
  }
}

