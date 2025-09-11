// dto/verify-otp.dto.ts
import { IsUUID, IsString, Length, IsEmail } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  phone_no: string;
  
  @IsEmail()
  email: string;
  
  @IsString()
  @Length(6, 6)
  code: string;
}
