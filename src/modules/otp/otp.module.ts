import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { OtpService } from './otp.service';
// import { OtpCleanupService } from './otpcleanupservice';
// import { OtpController } from './otp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Otp])],
  // controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
