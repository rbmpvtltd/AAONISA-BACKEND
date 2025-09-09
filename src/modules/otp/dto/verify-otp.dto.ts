// dto/verify-otp.dto.ts
import { IsUUID, IsString, Length, IsEmail } from 'class-validator';

export class VerifyOtpDto {
  // @IsUUID()
  // userId: string;
  @IsEmail()
  email: string;
  
  @IsString()
  @Length(6, 6)
  code: string;
}
