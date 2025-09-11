import {
  IsString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Length
} from 'class-validator';


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
export class VerifyOtpDto {
  @IsString()
    @Validate(IsEmailOrPhoneConstraint)
    emailOrPhone: string;
  
  @IsString()
  @Length(6, 6)
  code: string;
}
