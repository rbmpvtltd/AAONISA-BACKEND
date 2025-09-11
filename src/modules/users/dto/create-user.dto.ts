import {
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

@ValidatorConstraint({ name: 'IsEmailOrPhone', async: false })
class IsEmailOrPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;
    return emailRegex.test(value) || phoneRegex.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return 'emailOrPhone must be a valid email or phone number';
  }
}

export class PreRegisterDto {
  @IsString()
  @Validate(IsEmailOrPhoneConstraint)
  emailOrPhone: string;

  @IsString()
  username: string;
}



export class RegisterDto {
  @IsString()
  @Validate(IsEmailOrPhoneConstraint)
  emailOrPhone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.USER;

  @IsString()
  otp: string;
}

export class LoginDto {
  @IsString()
  @Validate(IsEmailOrPhoneConstraint)
  emailOrPhone: string;

  @IsString()
  password: string;

  resetTokenExpiry: Date; // Assuming this is for internal use; no validation needed?
}
export class ForgotPasswordDto {
  @IsString()
  @Validate(IsEmailOrPhoneConstraint)
  emailOrPhone: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
