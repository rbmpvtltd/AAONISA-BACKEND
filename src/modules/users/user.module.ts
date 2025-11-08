import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from './entities/user-profile.entity';
import { User } from './entities/user.entity';
import { AuthModule} from '../auth/auth.module';
import { OtpModule } from '../otp/otp.module'
import { Type } from 'class-transformer';
import { Video} from '../stream/entities/video.entity'
import { Like } from '../likes/entities/like.entity';
import { View } from '../views/entities/view.entity'; 
import { Follow } from '../follows/entities/follow.entity'; 
import { NotificationModule } from '../notifications/notification.module';
import { UploadService } from '../upload/upload.service';
import { BlockService } from './block.service';
import { BlockModule } from './block.module';
import {TokenModule } from '../tokens/token.module';
@Module({
  imports: [TypeOrmModule.forFeature([UserProfile,User,Video,Like,View,Follow]),
  AuthModule,
  TypeOrmModule.forFeature([User]),
  OtpModule,
  forwardRef(() => NotificationModule),
  BlockModule,
  TokenModule
],
  providers: [UserService,UploadService,BlockService],
  controllers: [UserController],
  exports: [UserService]
})

export class UserProfileModule {}
