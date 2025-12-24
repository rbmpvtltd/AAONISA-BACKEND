import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagementOtp } from './entities/management-otp.entity';
import { ManagementOtpService } from './management-otp.service';
import { EmailService } from '../otp/email.service';
import { SmsService } from '../otp/sms.service';

@Module({
  imports: [TypeOrmModule.forFeature([ManagementOtp])],
  providers: [ManagementOtpService,EmailService,SmsService],
  exports: [ManagementOtpService,EmailService,SmsService],
})
export class MangagementOtpModule {}