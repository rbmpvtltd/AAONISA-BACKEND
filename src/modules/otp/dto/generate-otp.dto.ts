import { IsEmail, IsOptional, IsPhoneNumber,IsUUID } from 'class-validator';

export class GenerateOtpDto {
  @IsUUID()
  userId: string;
  
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}
