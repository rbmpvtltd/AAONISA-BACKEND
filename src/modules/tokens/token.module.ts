import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from './entities/token.entity';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TokenEntity, User])],
  controllers: [TokenController],
  providers: [TokenService],
})
export class TokenModule {}
