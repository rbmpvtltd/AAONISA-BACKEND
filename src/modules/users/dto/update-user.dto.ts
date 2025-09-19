import { IsEmail, IsString } from 'class-validator';

export class UpdateUserEmail {
    @IsEmail()
    email: string;

    @IsString()
    otp: string;
}

export class UpdateUserPhone {
    @IsString()
    phone: string;

    @IsString()
    otp: string;
}
