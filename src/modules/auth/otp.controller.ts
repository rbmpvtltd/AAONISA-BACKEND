import { Controller, Post, Body } from '@nestjs/common';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('generate')
  generate(@Body('identifier') identifier: string) {
    const otp = this.otpService.generateOtp(identifier);
    return { identifier, otp }; // You’d send this via SMS/Email in real use
  }

  @Post('verify')
  verify(@Body() body: { identifier: string; code: string }) {
    const isValid = this.otpService.validateOtp(body.identifier, body.code);
    return { success: isValid };
  }
}
