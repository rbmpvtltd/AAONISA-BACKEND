import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

// @Controller('otp')
// export class OtpController {
//   constructor(private readonly otpService: OtpService) {}

//   @Post('generate')
//   async generate(@Body() body: GenerateOtpDto) {
//     const otp = await this.otpService.generateOtp(body.userId);
//     return { userId: body.userId, otp };
//   }

//   @Post('verify')
//   async verify(@Body() body: VerifyOtpDto) {
//     const isValid = await this.otpService.validateOtp(body.email, body.code);
//     return { success: isValid };
//   }
// }
