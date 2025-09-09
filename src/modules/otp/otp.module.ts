import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { OtpService } from './otp.service';
import { EmailService } from './EmailService';
// import { OtpCleanupService } from './otpcleanupservice';
// import { OtpController } from './otp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Otp])],
  // controllers: [OtpController],
  providers: [OtpService,EmailService],
  exports: [OtpService,EmailService],
})
export class OtpModule {}
