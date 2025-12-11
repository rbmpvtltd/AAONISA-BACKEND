import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { TokenEntity } from './entities/token.entity';
import { CreateTokenDto } from './dto/create-token.dto';
import { AssignTokenDto } from './dto/assign-token.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TokenService {
  private expo = new Expo();

  constructor(
    @InjectRepository(TokenEntity)
    private readonly tokenRepo: Repository<TokenEntity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private validateTokenFormat(token: string) {
    if (!Expo.isExpoPushToken(token)) {
      throw new BadRequestException('Invalid Expo push token format');
    }
  }

  async createToken(dto: CreateTokenDto) {
    this.validateTokenFormat(dto.token);

    let token = await this.tokenRepo.findOne({ where: { token: dto.token } });

    if (!token) {
      token = this.tokenRepo.create({ token: dto.token });
      await this.tokenRepo.save(token);
    }

    return token;
  }

  async assignToken(dto: AssignTokenDto, userId: string) {
    const { token } = dto;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const tokenEntity = await this.tokenRepo.findOne({ where: { token } });
    if (!tokenEntity) throw new NotFoundException('Token not found');

    tokenEntity.user = user;
    return await this.tokenRepo.save(tokenEntity);
  }

  async unassignToken(token: string, userId: string) {
    const tokenEntity = await this.tokenRepo.findOne({ where: { token }, relations: ['user'] });
    if (!tokenEntity) throw new NotFoundException('Token not found');

    tokenEntity.user = null;
    return await this.tokenRepo.save(tokenEntity);
  }

  async removeInvalidToken(token: string) {
    await this.tokenRepo.delete({ token });
    return { success: true };
  }

  // ---------------------------------------------
  // 🚀 NEW: Send Normal Notification
  // ---------------------------------------------
//   async sendNotification(userId: string, title: string, body: string, data?: Record<string, any>) {
//   const tokenEntity = await this.tokenRepo.findOne({ where: { user: { id: userId } } });
//   if (!tokenEntity) {
//     console.warn(`Cannot send notification: No token found for user ${userId}`);
//     return { success: false, message: 'No token assigned to this user' }; // or just { success: false }
//   }

//   const token = tokenEntity.token;
//   this.validateTokenFormat(token);

//   const message: ExpoPushMessage = {
//     to: token,
//     sound: 'default',
//     title,
//     body,
//     data: data || {},
//   };

//   const tickets: ExpoPushTicket[] = await this.expo.sendPushNotificationsAsync([message]);
//   const ticket = tickets[0];

//   if (ticket.status === 'error') {
//     console.error('Push failed:', ticket.message);
//     if (ticket.details?.error === 'DeviceNotRegistered') {
//       await this.removeInvalidToken(token);
//     }
//     throw new BadRequestException(ticket.message);
//   }
//   console.log("notification sent successfully to user:", userId);
//   return { success: true, ticket };
// }
  async sendNotification(userId: string, title: string, body: string, data?: Record<string, any>) {

  const tokenEntities = await this.tokenRepo.find({
    where: { user: { id: userId } },
  });

  if (!tokenEntities.length) {
    console.warn(`❌ No push tokens for user: ${userId}`);
    return { success: false, reason: 'NO_TOKEN' };
  }

  const messages: ExpoPushMessage[] = [];

  for (const tokenEntity of tokenEntities) {
    const token = tokenEntity.token;

    if (!Expo.isExpoPushToken(token)) {
      console.error('❌ Invalid token detected:', token);
      await this.removeInvalidToken(token);
      continue;
    }

    messages.push({
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
      channelId: 'default', // ✅ ANDROID FIX
    });
  }

  const tickets = await this.expo.sendPushNotificationsAsync(messages);
  const receiptIds = tickets
  .filter(t => t.status === 'ok')
  .map(t => (t as any).id)
  .filter(Boolean);

  if (receiptIds.length) {
    const receipts = await this.expo.getPushNotificationReceiptsAsync(receiptIds);
    for (const receiptId in receipts) {
      const receipt = receipts[receiptId];

      if (receipt.status === 'error') {
        if (receipt.details?.error === 'DeviceNotRegistered') {
          const badToken = messages.find(m => m.to === receiptId)?.to;
          if (badToken) {
            await this.removeInvalidToken(badToken as string);
            console.warn('🧹 Dead token removed:', badToken);
          }
        }
      }
    }
  }

  console.log('✅ Notification attempt completed for user:', userId);
  return { success: true };
}


  // ---------------------------------------------
  // 🔕 NEW: Send Silent (Data-only) Notification
  // ---------------------------------------------
  // async sendSilentNotification(token: string, data: Record<string, any> = {}) {
  //   this.validateTokenFormat(token);

  //   // No title/body => data-only message
  //   const message: ExpoPushMessage = {
  //     to: token,
  //     data,
  //     priority: 'high',
  //     // silent push flags
  //     mutableContent: false,
  //   };

  //   const tickets: ExpoPushTicket[] = await this.expo.sendPushNotificationsAsync([message]);
  //   const ticket = tickets[0];

  //   if (ticket.status === 'error') {
  //     console.error('Silent push failed:', ticket.message);
  //     if (ticket.details?.error === 'DeviceNotRegistered') {
  //       await this.removeInvalidToken(token);
  //     }
  //     throw new BadRequestException(ticket.message);
  //   }

  //   return { success: true, ticket };
  // }
  async sendSilentNotification(token: string, data: Record<string, any> = {}) {

  if (!Expo.isExpoPushToken(token)) {
    console.error('❌ Invalid silent push token:', token);
    return { success: false };
  }

  const message: ExpoPushMessage = {
    to: token,
    data,
    priority: 'high',
    _contentAvailable: true, // ✅ REQUIRED FOR iOS
    channelId: 'default',   // ✅ REQUIRED FOR Android
  };

  const tickets = await this.expo.sendPushNotificationsAsync([message]);
  console.log('✅ Silent push ticket:', tickets);

  return { success: true };
}

}
