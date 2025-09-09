import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from './entities/user-profile.entity';
import { User } from './entities/user.entity';
import { AuthModule} from '../auth/auth.module';
import { OtpModule } from '../otp/otp.module'
import { Type } from 'class-transformer';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfile]),
  AuthModule,
  TypeOrmModule.forFeature([User]),
  OtpModule,
],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService]
})

export class UserProfileModule {}
