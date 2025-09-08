import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';

@Module({
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService], // so it can be used in AuthModule
})
export class OtpModule {}
