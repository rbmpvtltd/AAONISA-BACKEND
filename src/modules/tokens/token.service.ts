import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expo } from 'expo-server-sdk';
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

  async assignToken(dto: AssignTokenDto) {
    const { token, userId } = dto;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const tokenEntity = await this.tokenRepo.findOne({ where: { token } });
    if (!tokenEntity) throw new NotFoundException('Token not found');

    tokenEntity.user = user;
    return await this.tokenRepo.save(tokenEntity);
  }

  async unassignToken(token: string) {
    const tokenEntity = await this.tokenRepo.findOne({ where: { token }, relations: ['user'] });
    if (!tokenEntity) throw new NotFoundException('Token not found');

    tokenEntity.user = null;
    return await this.tokenRepo.save(tokenEntity);
  }

  async removeInvalidToken(token: string) {
    await this.tokenRepo.delete({ token });
    return { success: true };
  }
}
