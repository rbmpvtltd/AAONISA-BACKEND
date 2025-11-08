import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { TokenEntity } from './entities/token.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TokenEntity, User])],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService], // 👈 Important for other modules to use it
})
export class TokenModule {}
