
// // import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
// // import { Server, Socket } from 'socket.io';

// // @WebSocketGateway({
// //   cors: { origin: '*' },
// //   namespace:'/socket.io'
// // })

// // export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
// //   @WebSocketServer()
// //   server: Server;
// //   private sockets: Set<string> = new Set();

// //   @SubscribeMessage('send_message')
// //   handleSendMessage(
// //     @MessageBody() data: { message: string },
// //     @ConnectedSocket() client: Socket
// //   ) {
// //     this.server.emit('receive_message', data);

// //     return { status: 'ok' };
// //   }
// //   handleConnection(client: Socket) {
// //     this.sockets.add(client.id);
// //     console.log(`⚡ New client connected: ${client.id}`);
// //   }

// //   handleDisconnect(client: Socket) {
// //     this.sockets.delete(client.id);
// //     console.log(`❌ Client disconnected: ${client.id}`);
// //   }

// //   // Broadcast to all connected sockets
// //   broadcast(event: string, data: any) {
// //     this.server.emit(event, data);
// //   }

// //   // Send to specific socketId
// //   emitToSocket(socketId: string, event: string, data: any) {
// //     this.server.to(socketId).emit(event, data);
// //   }

// //   // Optional: get all connected socketIds
// //   getAllSockets() {
// //     return Array.from(this.sockets);
// //   }
// // }

// import {
//   WebSocketGateway,
//   WebSocketServer,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   SubscribeMessage,
//   MessageBody,
//   ConnectedSocket,
// } from "@nestjs/websockets";
// import { Server, Socket } from "socket.io";
// import { ChatService } from "./modules/chat/chat.service";

// @WebSocketGateway({
//   cors: { origin: "*" },
//   namespace: "/socket.io",
// })
// export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer()
//   server: Server;

//   constructor(private readonly chatService: ChatService) {}

//   // userId → socketId
//   private users: Map<string, string> = new Map();
//   // clientId → rooms joined
//   private clientRooms: Map<string, Set<string>> = new Map();

//   // handleConnection(client: Socket) {
//   //   const userId = client.handshake.query.userId as string;
//   //   console.log(`Client connected: ${client.id} (userId: ${userId})`);

//   //   if (userId) {
//   //     this.users.set(userId, client.id);
//   //   }

//   //   // Initialize room set for this client
//   //   if (!this.clientRooms.has(client.id)) {
//   //     this.clientRooms.set(client.id, new Set());
//   //   }
//   // }

//   async handleConnection(client: Socket) {
//   const userId = client.handshake.query.userId as string;

//   console.log(`Client connected: ${client.id} (userId: ${userId})`);

//   if (userId) {
//     // Check if this user already has an active socket
//     const oldSocketId = this.users.get(userId);

//     if (oldSocketId && oldSocketId !== client.id) {
//       try {
//         // Fetch all connected sockets
//         const sockets = await this.server.fetchSockets();
//         const oldSocket = sockets.find(s => s.id === oldSocketId);

//         if (oldSocket) {
//           console.log(`⚠ Disconnecting old socket for user ${userId}`);
//           oldSocket.disconnect(true); // force disconnect
//         }
//       } catch (error) {
//         console.error(`❌ Error disconnecting old socket for user ${userId}:`, error);
//       }
//     }

//     // Save new socket
//     this.users.set(userId, client.id);
//   }

//   // Initialize rooms set for this client
//   if (!this.clientRooms.has(client.id)) {
//     this.clientRooms.set(client.id, new Set());
//   }
// }


//   handleDisconnect(client: Socket) {
//     console.log(`Client disconnected: ${client.id}`);

//     // Remove from users map
//     for (const [userId, socketId] of this.users.entries()) {
//       if (socketId === client.id) this.users.delete(userId);
//     }

//     // Clean clientRooms
//     this.clientRooms.delete(client.id);
//   }

//   emitToUser(userId: string, event: string, data: any) {
//     const socketId = this.users.get(userId);
//     if (socketId) this.server.to(socketId).emit(event, data);
//   }

//   /* -------------------------
//      JOIN / LEAVE ROOM
//   ------------------------- */
//   @SubscribeMessage("joinRoom")
//   handleJoinRoom(
//     @MessageBody() data: { roomId: string },
//     @ConnectedSocket() client: Socket
//   ) {
//     const roomId = data.roomId;
//     const rooms = this.clientRooms.get(client.id) || new Set();

//     if (rooms.has(roomId)) {
//       console.log(`Client ${client.id} already in room ${roomId}, skipping join`);
//       return;
//     }

//     client.join(roomId);
//     rooms.add(roomId);
//     this.clientRooms.set(client.id, rooms);

//     console.log(`Client ${client.id} joined room: ${roomId}`);
//   }

//   @SubscribeMessage("leaveRoom")
//   handleLeaveRoom(
//     @MessageBody() data: { roomId: string },
//     @ConnectedSocket() client: Socket
//   ) {
//     const roomId = data.roomId;
//     const rooms = this.clientRooms.get(client.id);

//     if (rooms?.has(roomId)) {
//       client.leave(roomId);
//       rooms.delete(roomId);
//       console.log(`Client ${client.id} left room: ${roomId}`);
//     }
//   }

//   /* -------------------------
//      MESSAGE HANDLERS
//   ------------------------- */
//   @SubscribeMessage("sendMessage")
//   async handleSendMessage(
//     @MessageBody() msg: { sessionId: number; senderId: string; receiverId: string; text: string },
//     @ConnectedSocket() client: Socket
//   ) {
//     console.log("📥 Received message:", msg);
//     const roomId = [msg.senderId, msg.receiverId].sort().join("-");
//     const saved = await this.chatService.sendMessage(msg.senderId, msg.sessionId, msg.text);

//     this.server.to(roomId).emit("Message", {
//       message_id: saved.chat_id,
//       text: saved.message_text,
//       senderId: msg.senderId,
//       receiverId: msg.receiverId,
//       createdAt: saved.created_at,
//     });
//   }

//   // @SubscribeMessage("getPreviousMessages")
//   // async handleGetPreviousMessages(
//   //   @MessageBody() data: { user1Id: string; user2Id: string },
//   //   @ConnectedSocket() client: Socket
//   // ) {
//   //   try {
//   //     const { user1Id, user2Id } = data;
//   //     console.log("📥 Fetching previous messages for:", user1Id, user2Id);

//   //     const session = await this.chatService.createSession(user1Id, user2Id);
//   //     const messages = await this.chatService.getSessionMessages(session.session_id);

//   //     // Emit **only to requesting client** to prevent multiple emits
//   //     client.emit("previousMessages", {
//   //       sessionId: session.session_id,
//   //       messages,
//   //     });

//   //     console.log(`📜 Sent ${messages.length} previous messages to client ${client.id}`);
//   //   } catch (error) {
//   //     console.error("❌ Error fetching previous messages:", error);
//   //   }
//   // }

//   @SubscribeMessage("getPreviousMessages")
// async handleGetPreviousMessages( 
//   @MessageBody() data: { user1Id: string; user2Id: string },
//   @ConnectedSocket() client: Socket
// ) {
//   try {
//     const { user1Id, user2Id } = data;

//     console.log("📥 Fetching previous messages for:", user1Id, user2Id);

//     // FIND EXISTING SESSION
//     let session = await this.chatService.findSessionByUsers(user1Id, user2Id);

//     // CREATE ONLY IF ABSOLUTELY NECESSARY
//     if (!session) {
//       session = await this.chatService.createSession(user1Id, user2Id);
//     }

//     const messages = await this.chatService.getSessionMessages(session.session_id);

//     client.emit("previousMessages", {
//       sessionId: session.session_id,
//       messages,
//     });

//   } catch (error) {
//     console.error("❌ Error fetching previous messages:", error);
//   }
// }


//   @SubscribeMessage("deleteMessageForMe")
//   async handleDeleteForMe(
//     @MessageBody() data: { messageId: string; userId: string; roomId: string },
//     @ConnectedSocket() client: Socket
//   ) {
//     await this.chatService.deleteMessageForMe(data.userId, data.messageId);
//     client.emit("messageDeletedForMe", { messageId: data.messageId });
//   }

//   @SubscribeMessage("deleteMessageForEveryone")
//   async handleDeleteForEveryone(
//     @MessageBody() data: { messageId: string; userId: string; roomId: string },
//     @ConnectedSocket() client: Socket
//   ) {
//     await this.chatService.deleteMessageForEveryone(data.userId, data.messageId);
//     this.server.to(data.roomId).emit("messageDeleted", { messageId: data.messageId, deletedForEveryone: true });
//   }

//   broadcast(event: string, data: any) {
//     this.server.emit(event, data);
//   }
// }


import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { ChatService } from "./modules/chat/chat.service";
import { ViewService } from "./modules/views/view.service";
import { TokenService } from "./modules/tokens/token.service";
import { User } from "./modules/users/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
interface JoinRoomPayload {
  roomId: string;
}

interface SendMessagePayload {
  sessionId: number;
  senderId: string;
  receiverId: string;
  text: string;
}

interface GetPreviousMessagesPayload {
  user1Id: string;
  user2Id: string;
}

interface DeleteMessagePayload {
  messageId: string;
  userId: string;
  roomId: string;
}

@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "/socket.io",
  transports: ['websocket', 'polling'],
})
export class AppGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppGateway.name);

  // Maps userId to their current socketId
  private readonly userSockets = new Map<string, string>();

  // Maps socketId to set of rooms they've joined
  private readonly clientRooms = new Map<string, Set<string>>();

  // Track if gateway is initialized
  private isInitialized = false;
  constructor(private readonly chatService: ChatService, private readonly viewService: ViewService, private readonly tokenService: TokenService, @InjectRepository(User)
  private readonly userRepo: Repository<User>) { }
  /* ========================================
     GATEWAY INITIALIZATION
  ======================================== */
  afterInit(server: Server) {
    if (this.isInitialized) {
      this.logger.warn('⚠️ Gateway already initialized - skipping duplicate initialization');
      return;
    }

    this.isInitialized = true;
    this.logger.log('🚀 WebSocket Gateway Initialized');
  }

  /* ========================================
     CONNECTION LIFECYCLE
  ======================================== */

  async handleConnection(client: Socket): Promise<void> {
    const userId = client.handshake.query.userId as string;

    this.logger.log(`✅ Client connected: ${client.id} (userId: ${userId})`);

    if (!userId) {
      this.logger.warn(`Client ${client.id} connected without userId`);
      this.initializeClientRooms(client.id);
      return;
    }

    await this.handleUserConnection(userId, client);
    this.initializeClientRooms(client.id);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`❌ Client disconnected: ${client.id}`);

    this.removeUserSocket(client.id);
    this.clientRooms.delete(client.id);
  }

  /* ========================================
     ROOM MANAGEMENT
  ======================================== */

  @SubscribeMessage("joinRoom")
  handleJoinRoom(
    @MessageBody() data: JoinRoomPayload,
    @ConnectedSocket() client: Socket
  ): void {
    const { roomId } = data;

    if (!roomId) {
      this.logger.warn(`Client ${client.id} attempted to join without roomId`);
      return;
    }

    const rooms = this.clientRooms.get(client.id) || new Set();

    if (rooms.has(roomId)) {
      this.logger.debug(`Client ${client.id} already in room ${roomId}`);
      return;
    }

    client.join(roomId);
    rooms.add(roomId);
    this.clientRooms.set(client.id, rooms);

    this.logger.log(`🚪 Client ${client.id} joined room: ${roomId}`);
  }

  @SubscribeMessage("leaveRoom")
  handleLeaveRoom(
    @MessageBody() data: JoinRoomPayload,
    @ConnectedSocket() client: Socket
  ): void {
    const { roomId } = data;
    const rooms = this.clientRooms.get(client.id);

    if (rooms?.has(roomId)) {
      client.leave(roomId);
      rooms.delete(roomId);
      this.logger.log(`🚪 Client ${client.id} left room: ${roomId}`);
    }
  }

  /* ========================================
     MESSAGE HANDLERS
  ======================================== */

  @SubscribeMessage("sendMessage")
  async handleSendMessage(
    @MessageBody() payload: SendMessagePayload,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    const startTime = Date.now();
    const requestId = `${client.id}-${startTime}`;

    try {
      this.logger.log(
        `📥 [${requestId}] Message from ${payload.senderId} to ${payload.receiverId}`
      );

      const { sessionId, senderId, receiverId, text } = payload;
      const sender = await this.userRepo.findOne({ where: { id: senderId } });
      if (!sender) {
        return
      }
      // Validate payload
      if (!sessionId || !senderId || !receiverId || !text) {
        this.logger.error(`[${requestId}] Invalid message payload`, payload);
        client.emit("error", { message: "Invalid message data" });
        return;
      }

      // Save message to database (THIS SHOULD ONLY HAPPEN ONCE!)
      const savedMessage = await this.chatService.sendMessage(
        senderId,
        sessionId,
        text
      );

      // Generate consistent room ID
      const roomId = this.generateRoomId(senderId, receiverId);
      if (!roomId) {
        console.error(`[${requestId}] roomId is invalid`);
        return;
      }

      // Emit to room
      this.server.to(roomId).emit("Message", {
        message_id: savedMessage.chat_id,
        text: savedMessage.message_text,
        senderId,
        receiverId,
        createdAt: savedMessage.created_at,
      });
      let inSameRoom = await this.areBothUsersInRoom(roomId)
      if (!inSameRoom) {
        await this.tokenService.sendNotification(receiverId, "Hithoy", `${sender.username} sent you a chat`)
      }
      // const duration = Date.now() - startTime;
      // this.logger.log(
      //   `✅ [${requestId}] Message saved and emitted to room: ${roomId} (${duration}ms)`
      // );
    } catch (error) {
      this.logger.error(`[${requestId}] Error handling sendMessage:`, error);
      client.emit("error", { message: "Failed to send message" });
    }

  }

  @SubscribeMessage("getPreviousMessages")
  async handleGetPreviousMessages(
    @MessageBody() payload: GetPreviousMessagesPayload,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    try {
      const { user1Id, user2Id } = payload;

      if (!user1Id || !user2Id) {
        this.logger.error("Invalid getPreviousMessages payload", payload);
        client.emit("error", { message: "Invalid user IDs" });
        return;
      }

      this.logger.log(`📥 Fetching messages for: ${user1Id} ↔ ${user2Id}`);

      // Find or create session
      let session = await this.chatService.findSessionByUsers(user1Id, user2Id);

      if (!session) {
        this.logger.log(`Creating new session for ${user1Id} and ${user2Id}`);
        session = await this.chatService.createSession(user1Id, user2Id);
      }

      // Fetch messages
      const messages = await this.chatService.getSessionMessages(
        session.session_id
      );

      // Emit only to requesting client
      client.emit("previousMessages", {
        sessionId: session.session_id,
        messages,
      });

      this.logger.log(
        `📜 Sent ${messages.length} messages to client ${client.id}`
      );
    } catch (error) {
      this.logger.error("Error fetching previous messages:", error);
      client.emit("error", { message: "Failed to fetch messages" });
    }
  }

  @SubscribeMessage("deleteMessageForMe")
  async handleDeleteForMe(
    @MessageBody() payload: DeleteMessagePayload,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    try {
      const { messageId, userId } = payload;

      if (!messageId || !userId) {
        client.emit("error", { message: "Invalid delete payload" });
        return;
      }

      await this.chatService.deleteMessageForMe(userId, messageId);

      client.emit("messageDeletedForMe", { messageId });

      this.logger.log(`🗑️ Message ${messageId} deleted for user ${userId}`);
    } catch (error) {
      this.logger.error("Error deleting message for user:", error);
      client.emit("error", { message: "Failed to delete message" });
    }
  }
  @SubscribeMessage('getStoryViews')
  async handleGetStoryViews(
    @MessageBody() payload,
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { storyId } = payload;
      if (!storyId) {
        client.emit("error", { message: "Invalid delete payload" });
        return;
      }
      const views = await this.viewService.getAllViews(storyId);
      client.emit('storyViews', { views });

      return; // <-- VERY IMPORTANT
    }
    catch (error) {
      this.logger.error("Error getting views:", error);
      client.emit("error", { message: "Failed to get story views" });
    }
  }
  @SubscribeMessage('viewStory')
  async handleStoryView(
    @MessageBody() payload: { userId: string; storyId: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { userId, storyId } = payload;

      const result = await this.viewService.viewReel(userId, storyId);

      // Agar pehle hi viewed tha to emit mat karo
      if (!result.viewed) return;

      // NEW VIEW DETAILS FETCH KARO
      const newView = await this.viewService.getSingleView(userId, storyId);

      // 🔥 Real-time emit to story room
      this.server.to(`story:${storyId}`).emit("story:newView", newView);

    } catch (error) {
      client.emit("error", { message: "Failed to add story view" });
    }
  }

  @SubscribeMessage("deleteMessageForEveryone")
  async handleDeleteForEveryone(
    @MessageBody() payload: DeleteMessagePayload,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    try {
      const { messageId, userId, roomId } = payload;

      if (!messageId || !userId || !roomId) {
        client.emit("error", { message: "Invalid delete payload" });
        return;
      }

      await this.chatService.deleteMessageForEveryone(userId, messageId);

      this.server.to(roomId).emit("messageDeleted", {
        messageId,
        deletedForEveryone: true,
      });

      this.logger.log(`🗑️ Message ${messageId} deleted for everyone in room ${roomId}`);
    } catch (error) {
      this.logger.error("Error deleting message for everyone:", error);
      client.emit("error", { message: "Failed to delete message" });
    }
  }

  /* ========================================
     UTILITY METHODS
  ======================================== */

  /**
   * Emit event to all connected clients
   */
  broadcast(event: string, data: any): void {
    this.server.emit(event, data);
    this.logger.debug(`Broadcast event: ${event}`);
  }

  /**
   * Emit event to specific user by userId
   */
  emitToUser(userId: string, event: string, data: any): void {
    const socketId = this.userSockets.get(userId);

    if (socketId) {
      this.server.to(socketId).emit(event, data);
      this.logger.debug(`Emitted ${event} to user ${userId}`);
    } else {
      this.logger.warn(`User ${userId} not connected`);
    }
  }

  /**
   * Generate consistent room ID for two users
   */
  private generateRoomId(user1Id: string, user2Id: string): string {
    console.log("📥 Generating room ID for:", user1Id, user2Id);
    return [user1Id, user2Id].sort().join("-");
  }

  /**
   * Handle user connection and disconnect old socket if exists
   */
  private async handleUserConnection(
    userId: string,
    client: Socket
  ): Promise<void> {
    const oldSocketId = this.userSockets.get(userId);

    if (oldSocketId && oldSocketId !== client.id) {
      await this.disconnectOldSocket(userId, oldSocketId);
    }

    this.userSockets.set(userId, client.id);
  }

  /**
   * Disconnect old socket for user
   */
  private async disconnectOldSocket(
    userId: string,
    oldSocketId: string
  ): Promise<void> {
    try {
      const sockets = await this.server.fetchSockets();
      const oldSocket = sockets.find((s) => s.id === oldSocketId);

      if (oldSocket) {
        this.logger.warn(`⚠️ Disconnecting old socket for user ${userId}`);
        oldSocket.disconnect(true);
      }
    } catch (error) {
      this.logger.error(
        `Failed to disconnect old socket for user ${userId}:`,
        error
      );
    }
  }

  /**
   * Initialize empty room set for client
   */
  private initializeClientRooms(clientId: string): void {
    if (!this.clientRooms.has(clientId)) {
      this.clientRooms.set(clientId, new Set());
    }
  }

  /**
   * Remove user from userSockets map by socketId
   */
  private removeUserSocket(socketId: string): void {
    for (const [userId, sid] of this.userSockets.entries()) {
      if (sid === socketId) {
        this.userSockets.delete(userId);
        this.logger.debug(`Removed userId ${userId} from active users`);
        break;
      }
    }
  }

  /**
   * Get all connected socket IDs (for debugging)
   */
  getConnectedSockets(): string[] {
    return Array.from(this.userSockets.values());
  }

  /**
   * Get all active user IDs (for debugging)
   */
  getActiveUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  async areBothUsersInRoom(roomId: string): Promise<boolean> {
    const socketsInRoom = await this.server.in(roomId).fetchSockets();
    return socketsInRoom.length >= 2;
  }

}