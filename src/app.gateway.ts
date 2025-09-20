
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
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/socket.io',
})

export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

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
  }

  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}

