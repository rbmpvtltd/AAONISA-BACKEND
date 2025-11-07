import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { CreateTokenDto } from './dto/create-token.dto';
import { AssignTokenDto } from './dto/assign-token.dto';
import { TokenEntity } from './entities/token.entitiy';
import { Expo } from 'expo-server-sdk';
import  Redis from 'ioredis';

@Injectable()
export class TokenService {
  private redis = new Redis();
  private expo = new Expo();

  // ✅ Local format check
  private validateExpoTokenFormat(token: string) {
    if (!Expo.isExpoPushToken(token)) {
      throw new BadRequestException('Invalid Expo push token format');
    }
  }

  // 🔹 Create new token (no user assigned yet)
  async createToken(dto: CreateTokenDto): Promise<TokenEntity> {
    const { token } = dto;
    this.validateExpoTokenFormat(token);

    const exists = await this.redis.exists(`token:${token}`);
    if (exists) {
      const userId = await this.redis.get(`token:${token}`);
      return { token, userId: userId === 'null' ? null : userId, createdAt: new Date() };
    }

    await this.redis.set(`token:${token}`, 'null');
    await this.redis.set(`token:${token}:createdAt`, new Date().toISOString());

    return { token, userId: 'null', createdAt: new Date() };
  }

  // 🔹 Assign token to a user (login)
  async assignToken(dto: AssignTokenDto, userId: string): Promise<TokenEntity> {
    const { token } = dto;
    this.validateExpoTokenFormat(token);

    const exists = await this.redis.exists(`token:${token}`);
    if (!exists) {
      // first time we saw this token
      await this.createToken({ token });
    }

    await this.redis.set(`token:${token}`, userId);
    await this.redis.sadd(`user:${userId}:tokens`, token);

    const createdAt = await this.redis.get(`token:${token}:createdAt`);
    return { token, userId, createdAt: new Date(createdAt || Date.now()) };
  }

  // 🔹 Unassign token (logout)
  async unassignToken(token: string, userId: string): Promise<void> {
    this.validateExpoTokenFormat(token);

    const exists = await this.redis.exists(`token:${token}`);
    if (!exists) return;

    const assignedUser = await this.redis.get(`token:${token}`);
    if (assignedUser !== userId) throw new UnauthorizedException('Token not linked with this user');

    await this.redis.set(`token:${token}`, 'null');
    await this.redis.srem(`user:${userId}:tokens`, token);
  }

  // 🔹 Get all tokens of a user
  async getUserTokens(userId: string): Promise<string[]> {
    const tokens = await this.redis.smembers(`user:${userId}:tokens`);
    return tokens || [];
  }

  // 🔹 Debug: Get raw token info
  async getTokenInfo(token: string): Promise<TokenEntity | null> {
    const exists = await this.redis.exists(`token:${token}`);
    if (!exists) return null;
    const userId = await this.redis.get(`token:${token}`);
    const createdAt = await this.redis.get(`token:${token}:createdAt`);
    return { token, userId: userId === 'null' ? null : userId, createdAt: new Date(createdAt || Date.now()) };
  }
}
