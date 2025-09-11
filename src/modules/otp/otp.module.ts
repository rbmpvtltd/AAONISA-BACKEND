import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { OtpService } from './otp.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
// import { OtpCleanupService } from './otpcleanupservice';
// import { OtpController } from './otp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Otp])],
  // controllers: [OtpController],
  providers: [OtpService,EmailService,SmsService],
  exports: [OtpService,EmailService,SmsService],
})
export class OtpModule {}
