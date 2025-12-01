
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
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatService } from "./modules/chat/chat.service";

@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "/socket.io",
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  // userId → socketId
  private users: Map<string, string> = new Map();
  // clientId → rooms joined
  private clientRooms: Map<string, Set<string>> = new Map();

  // handleConnection(client: Socket) {
  //   const userId = client.handshake.query.userId as string;
  //   console.log(`Client connected: ${client.id} (userId: ${userId})`);

  //   if (userId) {
  //     this.users.set(userId, client.id);
  //   }

  //   // Initialize room set for this client
  //   if (!this.clientRooms.has(client.id)) {
  //     this.clientRooms.set(client.id, new Set());
  //   }
  // }

  async handleConnection(client: Socket) {
  const userId = client.handshake.query.userId as string;

  console.log(`Client connected: ${client.id} (userId: ${userId})`);

  if (userId) {
    // Check if this user already has an active socket
    const oldSocketId = this.users.get(userId);

    if (oldSocketId && oldSocketId !== client.id) {
      try {
        // Fetch all connected sockets
        const sockets = await this.server.fetchSockets();
        const oldSocket = sockets.find(s => s.id === oldSocketId);

        if (oldSocket) {
          console.log(`⚠ Disconnecting old socket for user ${userId}`);
          oldSocket.disconnect(true); // force disconnect
        }
      } catch (error) {
        console.error(`❌ Error disconnecting old socket for user ${userId}:`, error);
      }
    }

    // Save new socket
    this.users.set(userId, client.id);
  }

  // Initialize rooms set for this client
  if (!this.clientRooms.has(client.id)) {
    this.clientRooms.set(client.id, new Set());
  }
}


  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Remove from users map
    for (const [userId, socketId] of this.users.entries()) {
      if (socketId === client.id) this.users.delete(userId);
    }

    // Clean clientRooms
    this.clientRooms.delete(client.id);
  }

  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.users.get(userId);
    if (socketId) this.server.to(socketId).emit(event, data);
  }

  /* -------------------------
     JOIN / LEAVE ROOM
  ------------------------- */
  @SubscribeMessage("joinRoom")
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    const roomId = data.roomId;
    const rooms = this.clientRooms.get(client.id) || new Set();

    if (rooms.has(roomId)) {
      console.log(`Client ${client.id} already in room ${roomId}, skipping join`);
      return;
    }

    client.join(roomId);
    rooms.add(roomId);
    this.clientRooms.set(client.id, rooms);

    console.log(`Client ${client.id} joined room: ${roomId}`);
  }

  @SubscribeMessage("leaveRoom")
  handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    const roomId = data.roomId;
    const rooms = this.clientRooms.get(client.id);

    if (rooms?.has(roomId)) {
      client.leave(roomId);
      rooms.delete(roomId);
      console.log(`Client ${client.id} left room: ${roomId}`);
    }
  }

  /* -------------------------
     MESSAGE HANDLERS
  ------------------------- */
  @SubscribeMessage("sendMessage")
  async handleSendMessage(
    @MessageBody() msg: { sessionId: number; senderId: string; receiverId: string; text: string },
    @ConnectedSocket() client: Socket
  ) {
    const roomId = [msg.senderId, msg.receiverId].sort().join("-");
    console.log("📤 Sending message to room:", roomId, msg);

    const saved = await this.chatService.sendMessage(msg.senderId, msg.sessionId, msg.text);

    this.server.to(roomId).emit("Message", {
      message_id: saved.chat_id,
      text: saved.message_text,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      createdAt: saved.created_at,
    });
  }

  // @SubscribeMessage("getPreviousMessages")
  // async handleGetPreviousMessages(
  //   @MessageBody() data: { user1Id: string; user2Id: string },
  //   @ConnectedSocket() client: Socket
  // ) {
  //   try {
  //     const { user1Id, user2Id } = data;
  //     console.log("📥 Fetching previous messages for:", user1Id, user2Id);

  //     const session = await this.chatService.createSession(user1Id, user2Id);
  //     const messages = await this.chatService.getSessionMessages(session.session_id);

  //     // Emit **only to requesting client** to prevent multiple emits
  //     client.emit("previousMessages", {
  //       sessionId: session.session_id,
  //       messages,
  //     });

  //     console.log(`📜 Sent ${messages.length} previous messages to client ${client.id}`);
  //   } catch (error) {
  //     console.error("❌ Error fetching previous messages:", error);
  //   }
  // }

  @SubscribeMessage("getPreviousMessages")
async handleGetPreviousMessages( 
  @MessageBody() data: { user1Id: string; user2Id: string },
  @ConnectedSocket() client: Socket
) {
  try {
    const { user1Id, user2Id } = data;

    console.log("📥 Fetching previous messages for:", user1Id, user2Id);

    // FIND EXISTING SESSION
    let session = await this.chatService.findSessionByUsers(user1Id, user2Id);

    // CREATE ONLY IF ABSOLUTELY NECESSARY
    if (!session) {
      session = await this.chatService.createSession(user1Id, user2Id);
    }

    const messages = await this.chatService.getSessionMessages(session.session_id);

    client.emit("previousMessages", {
      sessionId: session.session_id,
      messages,
    });

  } catch (error) {
    console.error("❌ Error fetching previous messages:", error);
  }
}


  @SubscribeMessage("deleteMessageForMe")
  async handleDeleteForMe(
    @MessageBody() data: { messageId: string; userId: string; roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    await this.chatService.deleteMessageForMe(data.userId, data.messageId);
    client.emit("messageDeletedForMe", { messageId: data.messageId });
  }

  @SubscribeMessage("deleteMessageForEveryone")
  async handleDeleteForEveryone(
    @MessageBody() data: { messageId: string; userId: string; roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    await this.chatService.deleteMessageForEveryone(data.userId, data.messageId);
    this.server.to(data.roomId).emit("messageDeleted", { messageId: data.messageId, deletedForEveryone: true });
  }

  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}